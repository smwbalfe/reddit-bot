from shared.agent.agent_utils import load_agent_config
from shared.agent.agent_models import gemini_flash_lite_model, gemini_flash_model
from shared.models.agent_models import LeadIntentResponse
from pydantic_ai import Agent

lead_score_agent_weak = Agent(
    gemini_flash_lite_model,
    output_type=LeadIntentResponse,
    system_prompt=load_agent_config("lead_scoring_agent_config.json"),
)

lead_score_agent_strong = Agent(
    gemini_flash_model,
    output_type=LeadIntentResponse,
    system_prompt=load_agent_config("lead_scoring_agent_config.json"),
)
