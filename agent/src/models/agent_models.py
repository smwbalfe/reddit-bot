from pydantic import BaseModel, Field
from typing import List


class FactorScores(BaseModel):
    product_fit: int = Field(
        ..., ge=1, le=100, description="Score from 1-100 for how well post matches ICP"
    )
    intent_signals: int = Field(
        ..., ge=1, le=100, description="Score from 1-100 for buying intent in post"
    )
    urgency_indicators: int = Field(
        ..., ge=1, le=100, description="Score from 1-100 for urgency/timeline"
    )
    decision_authority: int = Field(
        ..., ge=1, le=100, description="Score from 1-100 for decision making power"
    )
    engagement_quality: int = Field(
        ..., ge=1, le=100, description="Score from 1-100 for post quality"
    )


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

    @property
    def final_score(self) -> int:
        weighted_sum = (
            self.factor_scores.product_fit * 0.60
            + self.factor_scores.intent_signals * 0.15
            + self.factor_scores.urgency_indicators * 0.10
            + self.factor_scores.decision_authority * 0.075
            + self.factor_scores.engagement_quality * 0.075
        )
        return round(weighted_sum)
