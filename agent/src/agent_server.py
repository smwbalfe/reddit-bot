#!/usr/bin/env python3
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from src.agent.services import extract_keywords, find_relevant_subreddits_by_keywords, generate_icp_and_pain_points_combined, generate_reddit_reply
import asyncio
from src.models import AnalyzeUrlRequest, AnalyzeUrlResponse, ICPConfigChangeRequest, ICPConfigChangeResponse, GenerateSuggestionsRequest, GenerateSuggestionsResponse, GenerateReplyRequest, GenerateReplyResponse
from src.utils.parse_page import fetch_html, parse_html_content
from src.db.db import DatabaseManager
from src.middleware.rate_limiter import check_rate_limit, limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

app = FastAPI(title="Keyword Generation API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/analyze-url", response_model=AnalyzeUrlResponse)
async def analyze_url_endpoint(request: AnalyzeUrlRequest, http_request: Request):
    await check_rate_limit(http_request, "analyze-url", 5, 300)
    try:
        html_content = await fetch_html(request.url)
        parsed_content = parse_html_content(html_content)
        
        icp_description, pain_points = await generate_icp_and_pain_points_combined(parsed_content)
        keywords = await extract_keywords(icp_description)
        subreddits = await find_relevant_subreddits_by_keywords(keywords, icp_description, count=20)

        return AnalyzeUrlResponse( 
            subreddits=subreddits[:20],
            icp_description=icp_description,
            pain_points=pain_points
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze URL: {str(e)}")

@app.post("/api/generate-suggestions", response_model=GenerateSuggestionsResponse)
async def generate_suggestions_endpoint(request: GenerateSuggestionsRequest, http_request: Request):
    await check_rate_limit(http_request, "generate-suggestions", 10, 300)
    try:
        content = f"{request.description}\n\nPain Points:\n{request.pain_points}"
        keywords = await extract_keywords(content)
        subreddits = await find_relevant_subreddits_by_keywords(keywords,content, count=25)
        return GenerateSuggestionsResponse(
            keywords=keywords[:request.keyword_count],
            subreddits=subreddits[:25]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate suggestions: {str(e)}")

@app.post("/api/icp-config-change", response_model=ICPConfigChangeResponse)
async def icp_config_change_endpoint(request: ICPConfigChangeRequest, http_request: Request):
    await check_rate_limit(http_request, "icp-config-change", 20, 300)
    try:
        db_manager = DatabaseManager()
        success = db_manager.trigger_scraper_refresh()
        if not success:
            raise HTTPException(status_code=500, detail="Failed to trigger scraper refresh")
        return ICPConfigChangeResponse(
            success=True,
            message=f"ICP configuration refresh triggered for {request.action} action"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to handle ICP config change: {str(e)}")

@app.post("/api/generate-reply", response_model=GenerateReplyResponse)
async def generate_reply_endpoint(request: GenerateReplyRequest, http_request: Request):
    await check_rate_limit(http_request, "generate-reply", 30, 300)
    try:
        reply = await generate_reddit_reply(request.reddit_post, request.product_description)
        return GenerateReplyResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate reply: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)