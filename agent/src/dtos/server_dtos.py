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

class FactorScores(BaseModel):
    product_fit: int
    intent_signals: int
    urgency_indicators: int
    decision_authority: int
    engagement_quality: int

class FactorJustifications(BaseModel):
    product_fit: str
    intent_signals: str
    urgency_indicators: str
    decision_authority: str
    engagement_quality: str

class LeadIntentResponse(BaseModel):
    # Legacy fields for backward compatibility
    buying_intent_category: str
    justification: str
    lead_quality: int
    pain_points: str
    suggested_engagement: str
    
    # New detailed scoring fields
    category: str
    final_score: int
    factor_scores: FactorScores
    factor_justifications: FactorJustifications
    overall_assessment: str

class KeywordResponse(BaseModel):
    keywords: List[str]

class SubredditResponse(BaseModel):
    subreddits: List[str]

class ICPResponse(BaseModel):
    icp_description: str

class GenerateReplyRequest(BaseModel):
    post_title: str
    post_content: str
    subreddit: str
    product_name: str
    product_description: str
    product_website: str

class GenerateReplyResponse(BaseModel):
    reply: str