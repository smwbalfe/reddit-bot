#!/bin/bash

source .env

docker build -t r-agent ./agent

docker run -d \
  --name r-agent \
  --restart unless-stopped \
  -e LOGFIRE_TOKEN="${LOGFIRE_TOKEN}" \
  -e REDDIT_CLIENT_ID="${REDDIT_CLIENT_ID}" \
  -e REDDIT_CLIENT_SECRET="${REDDIT_CLIENT_SECRET}" \
  -e OPENROUTER_API_KEY="${OPENROUTER_API_KEY}" \
  -e DATABASE_URL="${DATABASE_URL}" \
  r-agent

docker logs -f r-agent 