#!/usr/bin/env python3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from src.agent.services import extract_keywords, find_relevant_subreddits, generate_icp_description, extract_pain_points, find_relevant_subreddits_by_keywords
import asyncio
import logging
from contextlib import asynccontextmanager
from src.models import AnalyzeUrlRequest, AnalyzeUrlResponse, ICPConfigChangeRequest, ICPConfigChangeResponse
from src.utils.parse_page import fetch_html, parse_html_content
from src.reddit.reddit_scraper import reddit_main, stream_manager

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(reddit_main())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

app = FastAPI(title="Keyword Generation API", version="1.0.0", lifespan=lifespan)

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
        
        keywords_task = extract_keywords(parsed_content)
        icp_task = generate_icp_description(parsed_content)
        pain_points_task = extract_pain_points(parsed_content)
        
        keywords, icp_description, pain_points = await asyncio.gather(
            keywords_task, icp_task, pain_points_task
        )
        
        subreddits = await find_relevant_subreddits_by_keywords(keywords, parsed_content, request.subreddit_count)
        
        print(pain_points)
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
        logger.info(f"ICP configuration change detected: {request.action} for user {request.user_id}")
        
        if request.icp_id:
            logger.info(f"ICP ID affected: {request.icp_id}")
    
        stream_manager.trigger_refresh()
        
        return ICPConfigChangeResponse(
            success=True,
            message=f"ICP configuration refresh triggered for {request.action} action"
        )
        
    except Exception as e:
        logger.error(f"Error handling ICP config change: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to handle ICP config change: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)