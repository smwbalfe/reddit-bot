#!/usr/bin/env python3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from src.agent.services import extract_keywords, find_relevant_subreddits_by_keywords, generate_icp_and_pain_points_combined
import asyncio
from src.models import AnalyzeUrlRequest, AnalyzeUrlResponse, ICPConfigChangeRequest, ICPConfigChangeResponse, GenerateSuggestionsRequest, GenerateSuggestionsResponse
from src.utils.parse_page import fetch_html, parse_html_content
from src.db.db import DatabaseManager

app = FastAPI(title="Keyword Generation API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/analyze-url", response_model=AnalyzeUrlResponse)
async def analyze_url_endpoint(request: AnalyzeUrlRequest):
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
async def generate_suggestions_endpoint(request: GenerateSuggestionsRequest):
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
async def icp_config_change_endpoint(request: ICPConfigChangeRequest):
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

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)