import asyncio
import json
import logging
from typing import Callable, Any

logger = logging.getLogger(__name__)


async def run_agent(
    agent_func: Callable,
    prompt: str,
    operation_name: str,
    timeout: float = 15.0,
    default_return: Any = None,
    context: str = "",
) -> Any:
    """Centralized agent runner with retry logic, timeout handling, and error management."""
    for attempt in range(2):
        try:
            result = await asyncio.wait_for(agent_func(prompt), timeout=timeout)
            logger.info(
                f"{operation_name} completed successfully{f' for {context[:50]}...' if context else ''}"
            )
            return result
        except asyncio.TimeoutError:
            if attempt == 0:
                logger.warning(
                    f"{operation_name} timed out after {timeout}s{f' for {context[:50]}...' if context else ''} (attempt {attempt + 1}/2)"
                )
                continue
            logger.error(
                f"{operation_name} timed out after {timeout}s{f' for {context[:50]}...' if context else ''} (final attempt)"
            )
            return default_return
        except Exception as e:
            if attempt == 0:
                logger.warning(
                    f"Error during {operation_name.lower()}{f' for {context[:50]}...' if context else ''}: {e} (attempt {attempt + 1}/2)"
                )
                continue
            logger.error(
                f"Error during {operation_name.lower()}{f' for {context[:50]}...' if context else ''}: {e} (final attempt)"
            )
            return default_return
