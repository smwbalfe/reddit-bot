from pydantic_ai import Agent
from .model import model, gemini_pro_model, LeadIntentResponse, KeywordResponse, SubredditResponse, ICPResponse, reply_model
from pydantic import BaseModel
import json
import os

class ReplyResponse(BaseModel):
    reply: str

def load_reply_agent_config():
    """Load reply agent configuration from JSON file"""
    config_path = os.path.join(os.path.dirname(__file__), '..', '..', 'config', 'reply_agent_config.json')
    with open(config_path, 'r') as f:
        config = json.load(f)
    return json.dumps(config)

def load_lead_scoring_agent_config():
    """Load lead scoring agent configuration from JSON file"""
    config_path = os.path.join(os.path.dirname(__file__), '..', '..', 'config', 'lead_scoring_agent_config.json')
    with open(config_path, 'r') as f:
        config = json.load(f)
    return config['system_prompt']

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
    return config['system_prompt']

def load_icp_agent_config():
    """Load ICP agent configuration from JSON file"""
    config_path = os.path.join(os.path.dirname(__file__), '..', '..', 'config', 'icp_agent_config.json')
    with open(config_path, 'r') as f:
        config = json.load(f)
    return config['system_prompt']

def load_lead_reviewer_agent_config():
    """Load lead reviewer agent configuration from JSON file"""
    config_path = os.path.join(os.path.dirname(__file__), '..', '..', 'config', 'lead_reviewer_agent_config.json')
    with open(config_path, 'r') as f:
        config = json.load(f)
    return config['system_prompt']

agent = Agent(
    model,
    output_type=LeadIntentResponse,
    system_prompt=load_lead_scoring_agent_config(),
)


keyword_agent = Agent(
    gemini_pro_model,
    output_type=KeywordResponse,
    system_prompt=load_keyword_agent_config(),
)


subreddit_agent = Agent(
    gemini_pro_model,
    output_type=SubredditResponse,
    system_prompt=load_subreddit_agent_config(),
)


icp_agent = Agent(
    gemini_pro_model,
    output_type=ICPResponse,
    system_prompt=load_icp_agent_config(),
)

lead_reviewer_agent = Agent(
    gemini_pro_model,
    output_type=bool,
    system_prompt=load_lead_reviewer_agent_config(),
)

reply_generation_agent = Agent(
    reply_model,
    output_type=ReplyResponse,
    system_prompt=load_reply_agent_config(),
)

