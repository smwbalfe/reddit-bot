from pydantic import BaseModel
from typing import Optional, List

class KeywordRequest(BaseModel):
    description: str
    count: Optional[int] = 30

class KeywordFromUrlRequest(BaseModel):
    url: str
    count: Optional[int] = 30

class SubredditRequest(BaseModel):
    description: str
    count: Optional[int] = 20

class AnalyzeUrlRequest(BaseModel):
    url: str
    keyword_count: Optional[int] = 15
    subreddit_count: Optional[int] = 20

class AnalyzeUrlResponse(BaseModel):
    keywords: List[str]
    subreddits: List[str]
    icp_description: str

class LeadIntentResponse(BaseModel):
    buying_intent_category: str
    justification: str
    lead_quality: int
    pain_points: str
    suggested_engagement: str

class KeywordResponse(BaseModel):
    keywords: List[str]

class SubredditResponse(BaseModel):
    subreddits: List[str]

class ICPResponse(BaseModel):
    icp_description: str