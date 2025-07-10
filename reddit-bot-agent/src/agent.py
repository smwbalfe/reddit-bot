
from datetime import datetime
from pydantic_ai import Agent, RunContext
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openrouter import OpenRouterProvider
import os
import logfire
from dotenv import load_dotenv

load_dotenv()

logfire.configure()  
logfire.instrument_pydantic_ai()

openrouter_api_key = os.getenv('OPENROUTER_API_KEY')

if not openrouter_api_key:
    raise ValueError("OPENROUTER_API_KEY is not set")

model = OpenAIModel(
    'anthropic/claude-sonnet-4',
    provider=OpenRouterProvider(api_key=openrouter_api_key),
)

agent = Agent(model, system_prompt="Detect engagement farming in community posts and comments, this is basically any basic question that is ver ymundane and general")

@agent.tool
async def is_engagement_farming(ctx: RunContext) -> str:
    """
    Detect engagement farming in community posts and comments.
    
    Engagement farming is considered when posts/comments contain:
    
    - Basic, mundane questions that are overly general or obvious
    - Questions with easily searchable answers that don't require community input
    - Generic "what's your favorite..." or "unpopular opinion..." posts
    - Low-effort content designed to generate easy responses/upvotes
    - Repetitive questions that have been asked many times before
    - Questions that don't add meaningful discussion value to the community
    - Posts that are clearly designed to farm karma rather than seek genuine help
    - Generic polls or surveys without specific context or purpose
    - "Does anyone else..." posts about common experiences
    - Vague questions without specific details or research effort shown
    - Posts that could be answered with a simple Google search
    - Content that appears to be copy-pasted or template-based
    - Questions that lack specificity and context needed for meaningful answers
    
    Returns:
        str: Confirmation message with timestamp when engagement farming is detected
    """
    print("Simulating sending email to you@gmail.com: Engagement farming detected in community")
    return f"Simulated email sent to you@gmail.com: Engagement farming detected in community at {datetime.now().isoformat()}"
