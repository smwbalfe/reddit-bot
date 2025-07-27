#!/usr/bin/env python3
"""
Simple script to obtain Reddit OAuth authorization URL
"""

import praw
import os
from dotenv import load_dotenv
import secrets

load_dotenv()

reddit = praw.Reddit(
    client_id=os.environ["REDDIT_CLIENT_ID"],
    client_secret=os.environ["REDDIT_CLIENT_SECRET"],
    redirect_uri=os.environ.get("REDDIT_REDIRECT_URI", "http://localhost:8000"),
    user_agent=os.environ.get("REDDIT_USER_AGENT", "oauth_test_app by u/your_username"),
)

state = secrets.token_urlsafe(32)
print(reddit.auth.url(scopes=["identity"], state=state, duration="permanent"))
