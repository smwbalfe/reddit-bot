from server.agents.agents import icp_pain_points_combined_agent
from shared.agent.agent_services import run_agent
import logging

logger = logging.getLogger(__name__)


async def generate_icp_and_pain_points_combined(html_content: str) -> tuple[str, str]:
    result = await run_agent(
        icp_pain_points_combined_agent.run,
        html_content,
        "ICP description and pain points extraction",
        timeout=20.0,
        default_return=None,
        context=html_content,
    )

    if result is None:
        return (
            "Unable to generate ICP description due to timeout or error",
            "Unable to extract pain points due to timeout or error",
        )

    logger.info(
        f"Generated ICP description and pain points from content: {html_content[:100]}..."
    )
    return result.output.icp_description, result.output.pain_points
