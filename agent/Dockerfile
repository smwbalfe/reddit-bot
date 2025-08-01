FROM python:3.12-slim

WORKDIR /app

RUN pip install uv

COPY pyproject.toml uv.lock README.md ./

RUN uv sync --frozen

COPY src/ ./src/
COPY config/ ./config/

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "src.agent_server:app", "--host", "0.0.0.0", "--port", "8000"]
