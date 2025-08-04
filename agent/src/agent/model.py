from __future__ import annotations
import os
import logfire
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openrouter import OpenRouterProvider
from dotenv import load_dotenv

load_dotenv()

logfire.configure()
logfire.instrument_pydantic_ai()

openrouter_api_key = os.getenv("OPENROUTER_API_KEY")

if not openrouter_api_key:
    raise ValueError("OPENROUTER_API_KEY is not set")

gemini_flash_lite_model = OpenAIModel(
    "google/gemini-2.5-flash-lite",
    provider=OpenRouterProvider(api_key=openrouter_api_key),
)


gemini_flash_model = OpenAIModel(
    "google/gemini-2.5-flash",
    provider=OpenRouterProvider(api_key=openrouter_api_key),
)

gemini_pro_model = OpenAIModel(
    "google/gemini-2.5-pro",
    provider=OpenRouterProvider(api_key=openrouter_api_key),
)




