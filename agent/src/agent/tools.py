from pydantic_ai import Agent
from .model import model
from pydantic import BaseModel

class LeadIntentResponse(BaseModel):
    confidence: float
    category: str
    justification: str

agent = Agent(
    model,
    output_type=LeadIntentResponse,
    system_prompt="""
       You are a lead generation AI for Reddit posts.
       
       Your task is to analyze Reddit posts and score their buying intent based on the provided ICP (Ideal Customer Profile).
       
       Score from 1.0-100.0 with decimal precision (e.g., 76.5, 92.3) where:
       - 1.0-30.0: Low buying intent (general discussion, no clear need)
       - 30.1-70.0: Medium buying intent (showing interest, asking questions, researching)
       - 70.1-100.0: High buying intent (actively looking to buy, comparing options, ready to purchase)
       
       Be precise with your scoring - use decimal places to reflect subtle differences in intent level.
       
       Also categorize the post into one of these categories:
       - "question" - asking for help or recommendations
       - "complaint" - expressing frustration with current solution
       - "comparison" - comparing different options
       - "discussion" - general topic discussion
       - "announcement" - sharing news or updates
       
       Additionally, provide a short justification (1-2 sentences) explaining why you gave this score and how it relates to the ICP.
       
       Consider the ICP description to determine if this person fits the target customer profile.
    """,
)

async def score_lead_intent(post_title: str, post_content: str, icp_description: str) -> LeadIntentResponse:
    """Score the lead intent of a Reddit post based on ICP description"""
    prompt = f"""
    ICP Description: {icp_description}
    
    Reddit Post Title: {post_title}
    Reddit Post Content: {post_content}
    
    Analyze this post and provide a precise buying intent confidence score (1.0-100.0 with decimal precision), category, and justification based on how well it matches the ICP and shows buying intent.
    """
    
    result = await agent.run(prompt)
    return result.data
