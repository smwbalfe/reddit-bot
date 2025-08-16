import os
import json
import asyncio
from typing import Any, Callable


def load_agent_config(config_filename: str, return_as_json_string: bool = True):
    config_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "config", config_filename
    )
    with open(config_path, "r") as f:
        config = json.load(f)
    return json.dumps(config) if return_as_json_string else config


async def run_agent(
    agent_func: Callable,
    prompt: str,
    timeout: float = 15.0,
    default_return: Any = None,
) -> Any:
    for attempt in range(2):
        try:
            result = await asyncio.wait_for(agent_func(prompt), timeout=timeout)
            return result
        except asyncio.TimeoutError:
            if attempt == 0:
                continue
            return default_return
        except Exception:
            if attempt == 0:
                continue
            return default_return
