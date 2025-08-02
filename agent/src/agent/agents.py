from pydantic_ai import Agent
from .model import gemini_flash_lite_model, gemini_flash_model
from ..models.agent_models import LeadIntentResponse, KeywordResponse, SubredditResponse, ICPResponse
import json
import os

def load_lead_scoring_agent_config():
    """Load lead scoring agent configuration from JSON file"""
    config_path = os.path.join(os.path.dirname(__file__), '..', '..', 'config', 'lead_scoring_agent_config.json')
    with open(config_path, 'r') as f:
        config = json.load(f)
    return json.dumps(config)

def load_keyword_agent_config():
    """Load keyword agent configuration from JSON file"""
    config_path = os.path.join(os.path.dirname(__file__), '..', '..', 'config', 'keyword_agent_config.json')
    with open(config_path, 'r') as f:
        config = json.load(f)
    return json.dumps(config)

def load_subreddit_agent_config():
    """Load subreddit agent configuration from JSON file"""
    config_path = os.path.join(os.path.dirname(__file__), '..', '..', 'config', 'subreddit_agent_config.json')
    with open(config_path, 'r') as f:
        config = json.load(f)
    return config

def load_icp_agent_config():
    """Load ICP agent configuration from JSON file"""
    config_path = os.path.join(os.path.dirname(__file__), '..', '..', 'config', 'icp_agent_config.json')
    with open(config_path, 'r') as f:
        config = json.load(f)
    return config

def load_lead_reviewer_agent_config():
    """Load lead reviewer agent configuration from JSON file"""
    config_path = os.path.join(os.path.dirname(__file__), '..', '..', 'config', 'lead_reviewer_agent_config.json')
    with open(config_path, 'r') as f:
        config = json.load(f)
    return config


lead_score_agent_weak = Agent(
    gemini_flash_lite_model,
    output_type=LeadIntentResponse,
    system_prompt=load_lead_scoring_agent_config(),
)

lead_score_agent_strong = Agent(
    gemini_flash_model,
    output_type=LeadIntentResponse,
    system_prompt=load_lead_scoring_agent_config(),
)

keyword_generation_agent = Agent(
    gemini_flash_model,
    output_type=KeywordResponse,
    system_prompt=load_keyword_agent_config(),
)

subreddit_generation_agent = Agent(
    gemini_flash_model,
    output_type=SubredditResponse,
    system_prompt=load_subreddit_agent_config(),
)

icp_description_agent = Agent(
    gemini_flash_model,
    output_type=ICPResponse,
    system_prompt=load_icp_agent_config(),
)




