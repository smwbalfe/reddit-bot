import json
import logging
from server.agents.agents import reply_generation_agent
from shared.agent.agent_services import run_agent

logger = logging.getLogger(__name__)


async def generate_reddit_reply(reddit_post: str, product_description: str) -> str:
    prompt_data = {
        "reddit_post": reddit_post,
        "product_description": product_description,
    }
    prompt = json.dumps(prompt_data)

    result = await run_agent(
        reply_generation_agent.run,
        prompt,
        "Reddit reply generation",
        timeout=20.0,
        default_return=None,
        context=reddit_post[:100],
    )

    if result is None:
        return "Unable to generate reply due to timeout or error"

    logger.info(f"Generated reply for post: {reddit_post[:100]}...")
    return result.output.reply
