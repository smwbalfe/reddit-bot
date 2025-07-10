import requests
import os
from typing import Optional, Dict, Any
from dotenv import load_dotenv
import asyncio
from agent import agent
import time

load_dotenv()

# def get_user_last_tweets(
#     user_id: str,
#     api_key: str,
#     cursor: Optional[str] = None,
#     include_replies: bool = False
# ) -> Dict[str, Any]:
#     url = "https://api.twitterapi.io/twitter/user/last_tweets"
    
#     headers = {
#         "X-API-Key": api_key
#     }
    
#     params = {
#         "userId": user_id,
#         "includeReplies": include_replies
#     }
    
#     if cursor:
#         params["cursor"] = cursor
    
#     response = requests.get(url, headers=headers, params=params)
#     response.raise_for_status()
    
#     return response.json()

# def get_user_info(
#     user_name: str,
#     api_key: str
# ) -> Dict[str, Any]:
#     url = "https://api.twitterapi.io/twitter/user/info"
    
#     headers = {
#         "X-API-Key": api_key
#     }
    

    
#     params = {
#         "userName": user_name
#     }
    
#     response = requests.get(url, headers=headers, params=params)
#     response.raise_for_status()
    
#     return response.json()

def get_community_tweets(
    community_id: str,
    api_key: str,
    cursor: Optional[str] = None
) -> Dict[str, Any]:
    url = "https://api.twitterapi.io/twitter/community/tweets"
    
    headers = {
        "X-API-Key": api_key
    }
    
    params = {
        "community_id": community_id
    }
    
    if cursor:
        params["cursor"] = cursor
    
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    
    return response.json()

# user = get_user_info(user_name="simonbalfe", api_key=os.getenv('X_API_KEY') or '')

# my_id = user['data']['id']

# tweets = get_user_last_tweets(user_id=my_id, api_key=os.getenv('X_API_KEY') or '')
# for tweet in tweets['data']['tweets']:
#     print(tweet['text'])
#     print("---")

async def process_tweets():
    bip_id = "1493446837214187523"
    
    communities = get_community_tweets(community_id=bip_id, api_key=os.getenv('X_API_KEY') or '')
    tweets = communities['tweets']
    
    for tweet in tweets:
        time.sleep(1)
        print(f"Processing tweet: {tweet['text'][:100]}...")
        result = await agent.run(tweet['text'])
        

if __name__ == "__main__":
    asyncio.run(process_tweets())
