#!/bin/bash

source .env

docker build -t reddit-agent agent/

docker run -it --rm \
  -e LOGFIRE_TOKEN=${LOGFIRE_TOKEN} \
  -e REDDIT_CLIENT_ID=${REDDIT_CLIENT_ID} \
  -e REDDIT_CLIENT_SECRET=${REDDIT_CLIENT_SECRET} \
  -e OPENROUTER_API_KEY=${OPENROUTER_API_KEY} \
  -e DATABASE_URL=${DATABASE_URL} \
  reddit-agent 