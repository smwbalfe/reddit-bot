from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from server.db.db import ServerDatabaseManager
from server.services.find_subreddits import find_relevant_subreddits_by_keywords
from server.services.generate_descriptions import generate_icp_and_pain_points_combined
from server.services.generate_reply import generate_reddit_reply
from shared.models.server_models import (
    AnalyzeUrlRequest,
    AnalyzeUrlResponse,
    ICPConfigChangeRequest,
    ICPConfigChangeResponse,
    GenerateSuggestionsRequest,
    GenerateSuggestionsResponse,
    GenerateReplyRequest,
    GenerateReplyResponse,
)
from pydantic import BaseModel
from typing import Optional
from server.utils.parse_page import fetch_html, parse_html_content


class TriggerLeadSearchRequest(BaseModel):
    user_id: Optional[str] = None
    limit: Optional[int] = 50


class TriggerLeadSearchResponse(BaseModel):
    success: bool
    message: str
    leads_found: int


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
        icp_description, pain_points = await generate_icp_and_pain_points_combined(
            parsed_content
        )
        subreddits = await find_relevant_subreddits_by_keywords(icp_description)
        return AnalyzeUrlResponse(
            subreddits=subreddits[:20],
            icp_description=icp_description,
            pain_points=pain_points,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze URL: {str(e)}")


@app.post("/api/generate-suggestions", response_model=GenerateSuggestionsResponse)
async def generate_suggestions_endpoint(request: GenerateSuggestionsRequest):
    try:
        content = f"{request.description}\n\nPain Points:\n{request.pain_points}"
        subreddits = await find_relevant_subreddits_by_keywords(content)
        return GenerateSuggestionsResponse(subreddits=subreddits[:25])
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate suggestions: {str(e)}"
        )


@app.post("/api/icp-config-change", response_model=ICPConfigChangeResponse)
async def icp_config_change_endpoint(request: ICPConfigChangeRequest):
    try:
        db_manager = ServerDatabaseManager()
        success = db_manager.trigger_scraper_refresh()
        if not success:
            raise HTTPException(
                status_code=500, detail="Failed to trigger scraper refresh"
            )
        return ICPConfigChangeResponse(
            success=True,
            message=f"ICP configuration refresh triggered for {request.action} action",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to handle ICP config change: {str(e)}"
        )


@app.post("/api/generate-reply", response_model=GenerateReplyResponse)
async def generate_reply_endpoint(request: GenerateReplyRequest):
    try:
        reply = await generate_reddit_reply(
            request.reddit_post, request.product_description
        )
        return GenerateReplyResponse(reply=reply)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate reply: {str(e)}"
        )


@app.post("/api/trigger-lead-search", response_model=TriggerLeadSearchResponse)
async def trigger_lead_search_endpoint(request: TriggerLeadSearchRequest):
    try:
        db_manager = ServerDatabaseManager()
        
        # Trigger manual collection by setting a system flag
        success = db_manager.set_system_flag("manual_collection_requested", True)
        if request.user_id:
            db_manager.set_system_flag("manual_collection_user_id", request.user_id)
        if request.limit:
            db_manager.set_system_flag("manual_collection_limit", str(request.limit))
        
        if not success:
            raise HTTPException(
                status_code=500, detail="Failed to trigger lead search"
            )
        
        return TriggerLeadSearchResponse(
            success=True,
            message="Lead search triggered successfully. Results will be available shortly.",
            leads_found=0  # Will be updated by the scraper
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to trigger lead search: {str(e)}"
        )


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
