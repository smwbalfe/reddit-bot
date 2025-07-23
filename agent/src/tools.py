from pydantic_ai import Agent, RunContext
from pydantic_ai.tools import Tool
from models import model
import os
import supabase

supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or ""
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or ""
supabase_client = supabase.create_client(supabase_url, supabase_key)

agent = Agent(
    model,
    system_prompt="You are a lead generation agent, you must determine the posts to ping based on user prompts",
)


def create_runtime_tool(name: str, description: str, handler_func):
    """Create and register an agent.tool at runtime"""

    def tool_func(
        ctx: RunContext, title: str, subreddit: str, content: str, url: str
    ) -> str:
        return handler_func(ctx, title, subreddit, content, url)

    tool_func.__name__ = name
    tool_func.__doc__ = description
    decorated_tool = agent.tool(tool_func)
    return decorated_tool


@agent.tool
def add_reddit_post(
    ctx: RunContext, title: str, subreddit: str, content: str, url: str, config_id: str, confidence: int
) -> str:
    """
    Add a Reddit post to the database when it matches the content prompt.
    
    This tool should be called when a Reddit post's title or content matches
    the provided content prompt. It stores the post details and assigns a
    confidence score indicating how well the post matches the prompt.
    
    Args:
        ctx: RunContext for the agent
        title: The Reddit post title
        subreddit: The subreddit name where the post was found
        content: The full content/body of the Reddit post
        url: The URL link to the Reddit post
        config_id: The configuration ID for this lead generation instance
        confidence: Integer from 1-100 indicating confidence that post matches prompt
        
    Returns:
        str: Confirmation message about confidence assessment
    """

    
    supabase_client.table("RedditPost").insert(
        {
            "subreddit": subreddit,
            "title": title,
            "content": content,
            "category": "post",
            "url": url,
            "configId": config_id,
            "confidence": confidence
        }
    ).execute()

    return f"You were {confidence}% confident the post matches the prompt"
