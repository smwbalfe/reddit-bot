from pydantic_ai import Agent, RunContext
from models import model
from pydantic import BaseModel
from typing import List

class PromptRequest(BaseModel):
    subreddit: str
    prompts: List[str]

class ConfidenceScore(BaseModel):
    prompt: str
    confidence: int

class BatchConfidenceResponse(BaseModel):
    scores: List[ConfidenceScore]

class ConfidenceResponse(BaseModel):
    confidence: int

agent = Agent(
    model,
    output_type=ConfidenceResponse,
    system_prompt="""
You are a lead generation agent. 
Analyze the Reddit post and determine how well 
it matches the agent prompt. Return ONLY a confidence score from 1 to 100 (where 100 is perfect match, 1 is no match).
 Do not provide explanations, just the number.

 make it as precise as possible dont just return 10, 20, 30, be specific
""",
)

batch_agent = Agent(
    model,
    output_type=BatchConfidenceResponse,
    system_prompt="""
You are a lead generation agent.
You will receive a JSON input with a subreddit and array of prompts.
For each prompt, analyze how well it matches the given subreddit context and return a confidence score from 1 to 100 (where 100 is perfect match, 1 is no match).
Return an array of confidence scores, one for each prompt in the same order.
Be precise with scores - don't just use round numbers like 10, 20, 30.
""",
)

async def process_batch_prompts(prompt_request: PromptRequest) -> BatchConfidenceResponse:
    content = f"Subreddit: {prompt_request.subreddit}\nPrompts to evaluate: {prompt_request.prompts}"
    response = await batch_agent.run(content)
    return response.output



