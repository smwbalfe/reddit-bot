import os
import json
import asyncio
from typing import Any, Callable


# async def run_agent(
#     agent_func: Callable,
#     prompt: str,
#     timeout: float = 15.0,
#     default_return: Any = None,
# ) -> Any:
#     for attempt in range(2):
#         try:
#             result = await asyncio.wait_for(agent_func(prompt), timeout=timeout)
#             return result
#         except asyncio.TimeoutError:
#             if attempt == 0:
#                 continue
#             return default_return
#         except Exception:
#             if attempt == 0:
#                 continue
#             return default_return
