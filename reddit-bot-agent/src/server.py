import sys
from fastapi import FastAPI
from typing import Dict
from pydantic import BaseModel
from pydantic_ai import Agent, RunContext
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openrouter import OpenRouterProvider
from datetime import datetime
from dotenv import load_dotenv
import logfire
from contextlib import asynccontextmanager
from src.agent import agent


load_dotenv()

logfire.configure()  
logfire.instrument_pydantic_ai()

class MessageRequest(BaseModel):
    message: str

def receive_signal(signalNumber, frame):
    print('Received:', signalNumber)
    sys.exit()

@asynccontextmanager
async def lifespan(app: FastAPI):
    import signal
    signal.signal(signal.SIGINT, receive_signal)
    yield

app = FastAPI(
    title="AI Agent Server",
    description="A lightweight AI agent server",
    version="1.0.0",
    lifespan=lifespan
)



@app.get("/")
async def root() -> Dict[str, str]:
    return {"message": "Hello, FastAPI!"}


@app.post("/chat")
async def chat(request: MessageRequest) -> Dict[str, str]:

    result = await agent.run(request.message)
    return {"response": result.output}