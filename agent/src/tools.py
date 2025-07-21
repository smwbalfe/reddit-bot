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
    system_prompt="You are being passed reddit posts, call the tool when appropriate",
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
    ctx: RunContext, title: str, subreddit: str, content: str, url: str
) -> str:
    """
    
    """
    supabase_client.table("RedditPost").insert(
        {
            "subreddit": subreddit,
            "title": title,
            "content": content,
            "category": "post",
            "url": url,
        }
    ).execute()
    return "Relationship post added, justify why you added it"


def my_handler(ctx, title, subreddit, content, url):
    print(f"Runtime tool processing: {title}")
    return f"Runtime processed: {title}"


