from typing import List
from pydantic import BaseModel


class KeywordResponse(BaseModel):
    keywords: List[str]


class PainPointsResponse(BaseModel):
    pain_points: str


class SubredditRelevanceResponse(BaseModel):
    relevant_subreddits: List[str]


class ICPPainPointsResponse(BaseModel):
    icp_description: str
    pain_points: str


class ReplyResponse(BaseModel):
    reply: str
