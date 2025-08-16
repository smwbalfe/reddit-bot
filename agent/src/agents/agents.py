from pydantic_ai import Agent
from ..agent.agent_models import gemini_flash_model
from ..models.models import (
    KeywordResponse,
    SubredditRelevanceResponse,
    ICPPainPointsResponse,
    ReplyResponse,
)
import json
import os


def load_agent_config(config_filename: str, return_as_json_string: bool = True):
    """Load agent configuration from JSON file"""
    config_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "config", config_filename
    )
    with open(config_path, "r") as f:
        config = json.load(f)
    return json.dumps(config) if return_as_json_string else config


keyword_generation_agent = Agent(
    gemini_flash_model,
    output_type=KeywordResponse,
    system_prompt=load_agent_config("keyword_agent_config.json"),
)

subreddit_relevance_agent = Agent(
    gemini_flash_model,
    output_type=SubredditRelevanceResponse,
    system_prompt=load_agent_config("subreddit_relevance_agent_config.json"),
)

icp_pain_points_combined_agent = Agent(
    gemini_flash_model,
    output_type=ICPPainPointsResponse,
    system_prompt=load_agent_config("icp_pain_points_combined_agent_config.json"),
)

reply_generation_agent = Agent(
    gemini_flash_model,
    output_type=ReplyResponse,
    system_prompt=load_agent_config("reply_agent_config.json"),
)
