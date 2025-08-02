from pydantic import BaseModel, Field
from typing import List, Optional



class ICPConfig(BaseModel):
    """Strongly typed ICP configuration model"""
    id: int
    description: str
    subreddits: Optional[List[str]] = None
    user_id: Optional[str] = None





class ProcessingResult(BaseModel):
    """Result of processing a Reddit post"""
    post_id: str
    icp_id: int
    qualified: bool
    score: int
    error: Optional[str] = None


class ScrapingConfig(BaseModel):
    """Configuration for the Reddit scraper"""

    sleep_interval: float = Field(default=0.1, ge=0.01)
    error_retry_delay: int = Field(default=5, ge=1)
    
    
