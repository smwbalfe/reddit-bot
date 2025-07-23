FROM python:3.12-slim

WORKDIR /app

RUN pip install uv

COPY pyproject.toml uv.lock README.md ./

RUN uv sync --frozen

COPY src/ ./src/

CMD ["uv", "run", "python", "src/reddit.py"]
