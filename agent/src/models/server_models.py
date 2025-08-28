from pydantic import BaseModel
from typing import Optional, List
from .agent_models import FactorScores, FactorJustifications



class AnalyzeUrlRequest(BaseModel):
    url: str


class AnalyzeUrlResponse(BaseModel):
    subreddits: List[str]
    icp_description: str
    pain_points: str


class LeadIntentResponse(BaseModel):
    pain_points: Optional[str] = None
    factor_scores: Optional[FactorScores] = None
    factor_justifications: Optional[FactorJustifications] = None


class GenerateSuggestionsRequest(BaseModel):
    description: str
    pain_points: str


class GenerateSuggestionsResponse(BaseModel):
    subreddits: List[str]


class GenerateReplyRequest(BaseModel):
    reddit_post: str
    product_description: str


class GenerateReplyResponse(BaseModel):
    reply: str


class InitialSeedingRequest(BaseModel):
    icp_id: Optional[int]


class ValidateSubredditRequest(BaseModel):
    subreddit_name: str


class ValidateSubredditResponse(BaseModel):
    is_valid: bool
    error_message: Optional[str] = None
