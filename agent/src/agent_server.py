from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from src.logging_config import setup_logging
from src.agent_scraper import (
    run_collection_cycle_sync,
    get_scraper_config,
    handle_initial_seeding,
    get_shared_db_manager,
)
from src.services.find_subreddits import find_relevant_subreddits_by_keywords
from src.services.generate_descriptions import generate_icp_and_pain_points_combined
from src.services.generate_reply import generate_reddit_reply
from src.utils.parse_page import fetch_html, parse_html_content
from src.models.server_models import (
    AnalyzeUrlRequest,
    AnalyzeUrlResponse,
    GenerateSuggestionsRequest,
    GenerateSuggestionsResponse,
    GenerateReplyRequest,
    GenerateReplyResponse,
    InitialSeedingRequest,
)
from datetime import datetime
import asyncio


logger = setup_logging()


def scraper_job():
    try:
        run_collection_cycle_sync()
    except Exception as e:
        logger.error(f"Error in scheduled scraper job: {e}")


scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    config = get_scraper_config()
    interval_seconds = config["polling_interval"]
    scheduler.add_job(
        scraper_job,
        "interval",
        seconds=interval_seconds,
        id="reddit_scraper",
        name="Reddit Post Collection",
        max_instances=1,
    )
    scheduler.start()
    logger.info(
        f"Scheduler started - scraper will run every {interval_seconds} seconds"
    )
    try:
        yield
    finally:
        scheduler.shutdown()
        logger.info("Scheduler shutdown")


app = FastAPI(title="SubLead Server", version="1.0.0", lifespan=lifespan)

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


@app.post("/scheduler/trigger-initial-seeding")
async def trigger_initial_seeding(request: InitialSeedingRequest):
    if request.icp_id is None:
        raise HTTPException(status_code=400, detail="icp_id is required")
    try:
        logger.info(
            f"Manual initial seeding trigger requested for ICP {request.icp_id}"
        )
        db_manager = get_shared_db_manager()
        asyncio.create_task(handle_initial_seeding(db_manager, request.icp_id))
        return {
            "message": f"Initial seeding triggered for ICP {request.icp_id}",
            "status": "started",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to trigger initial seeding: {str(e)}"
        )


@app.post("/scheduler/trigger-scrape")
async def trigger_scrape():
    try:
        logger.info("Manual scrape collection cycle trigger requested")
        asyncio.create_task(asyncio.to_thread(run_collection_cycle_sync))
        return {
            "message": "Scrape collection cycle triggered",
            "status": "started",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to trigger scrape: {str(e)}"
        )


@app.get("/scheduler/next-scrape-time")
async def get_next_scrape_time():
    try:
        job = scheduler.get_job("reddit_scraper")
        if job is None:
            raise HTTPException(status_code=404, detail="Scraper job not found")
        
        next_run_time = job.next_run_time
        if next_run_time is None:
            raise HTTPException(status_code=500, detail="No next run time scheduled")
        
        return {
            "next_run_time": next_run_time.isoformat(),
            "seconds_until_next_run": (next_run_time - datetime.now(next_run_time.tzinfo)).total_seconds(),
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get next scrape time: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
