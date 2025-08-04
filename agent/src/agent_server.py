#!/usr/bin/env python3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from src.agent.services import extract_keywords, generate_icp_description, extract_pain_points, find_relevant_subreddits_by_keywords, find_relevant_subreddits_alternative
import asyncio
from src.models import AnalyzeUrlRequest, AnalyzeUrlResponse, ICPConfigChangeRequest, ICPConfigChangeResponse
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
        keywords, icp_description, pain_points = await asyncio.gather(
            extract_keywords(parsed_content),
            generate_icp_description(parsed_content),
            extract_pain_points(parsed_content)
        )
        
        
        subreddits = await find_relevant_subreddits_by_keywords(keywords, parsed_content, request.subreddit_count)
        
        return AnalyzeUrlResponse(
            keywords=keywords[:request.keyword_count],
            subreddits=subreddits[:request.subreddit_count],
            icp_description=icp_description,
            pain_points=pain_points
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze URL: {str(e)}")

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