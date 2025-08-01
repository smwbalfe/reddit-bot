from __future__ import annotations
import os
import logfire
from pydantic import BaseModel, Field
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openrouter import OpenRouterProvider
from dotenv import load_dotenv
from typing import List

load_dotenv()

logfire.configure()
logfire.instrument_pydantic_ai()

openrouter_api_key = os.getenv("OPENROUTER_API_KEY")

if not openrouter_api_key:
    raise ValueError("OPENROUTER_API_KEY is not set")

model = OpenAIModel(
    "google/gemini-2.5-flash-lite",
    provider=OpenRouterProvider(api_key=openrouter_api_key),
)

gemini_pro_model = OpenAIModel(
    "google/gemini-2.5-flash",
    provider=OpenRouterProvider(api_key=openrouter_api_key),
)

reply_model = OpenAIModel(
    "google/gemini-2.5-flash",
    provider=OpenRouterProvider(api_key=openrouter_api_key),
)

reviewer_model = OpenAIModel(
    "google/gemini-2.5-flash",
    provider=OpenRouterProvider(api_key=openrouter_api_key),
)



class FactorScores(BaseModel):
    product_fit: int = Field(..., ge=1, le=100, description="Score from 1-100 for how well post matches ICP")
    intent_signals: int = Field(..., ge=1, le=100, description="Score from 1-100 for buying intent in post")
    urgency_indicators: int = Field(..., ge=1, le=100, description="Score from 1-100 for urgency/timeline")
    decision_authority: int = Field(..., ge=1, le=100, description="Score from 1-100 for decision making power")
    engagement_quality: int = Field(..., ge=1, le=100, description="Score from 1-100 for post quality")


class FactorJustifications(BaseModel):
    product_fit: str
    intent_signals: str
    urgency_indicators: str
    decision_authority: str
    engagement_quality: str


class LeadIntentResponse(BaseModel):
    category: str
    factor_scores: FactorScores
    factor_justifications: FactorJustifications
    pain_points: str
    overall_assessment: str
    
    @property
    def final_score(self) -> int:
        """Calculate weighted average: product_fit(40%) + intent_signals(25%) + urgency_indicators(15%) + decision_authority(10%) + engagement_quality(10%)"""
        weighted_sum = (
            self.factor_scores.product_fit * 0.60 +
            self.factor_scores.intent_signals * 0.15 +
            self.factor_scores.urgency_indicators * 0.10 +
            self.factor_scores.decision_authority * 0.075 +
            self.factor_scores.engagement_quality * 0.075
        )
        return round(weighted_sum)


class KeywordResponse(BaseModel):
    keywords: List[str]


class SubredditResponse(BaseModel):
    subreddits: List[str]


class ICPResponse(BaseModel):
    icp_description: str
