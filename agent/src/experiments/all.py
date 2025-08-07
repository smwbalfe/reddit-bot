import asyncio
from typing import List, Optional
from datetime import datetime
import sys
import os
from pydantic import BaseModel

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.reddit.client import RedditClient

class RedditSubmission(BaseModel):
    id: str
    title: str
    selftext: str
    url: str
    subreddit: str
    score: int
    upvote_ratio: float
    num_comments: int
    created_utc: float
    created_datetime: datetime
    author: Optional[str] = None
    is_self: bool
    permalink: str
    
    @classmethod
    def from_submission(cls, submission):
        return cls(
            id=submission.id,
            title=submission.title,
            selftext=submission.selftext or "",
            url=submission.url,
            subreddit=submission.subreddit.display_name,
            score=submission.score,
            upvote_ratio=submission.upvote_ratio,
            num_comments=submission.num_comments,
            created_utc=submission.created_utc,
            created_datetime=datetime.fromtimestamp(submission.created_utc),
            author=str(submission.author) if submission.author else None,
            is_self=submission.is_self,
            permalink=submission.permalink
        )

async def stream_past_submissions():
    reddit_client = RedditClient()
    submissions = []
    
    try:
        subreddit = await reddit_client.get_subreddit("all")
        
        submission_count = 0
        
        print("Streaming marketing submissions...")
        print("Press Ctrl+C to stop\n")
        
        async for submission in subreddit.stream.submissions(skip_existing=False):
            try:
                parsed_submission = RedditSubmission.from_submission(submission)
                submissions.append(parsed_submission)
                submission_count += 1
                
                print(f"#{submission_count} - r/{parsed_submission.subreddit}")
                print(f"Title: {parsed_submission.title}")
                print(f"Score: {parsed_submission.score} | Comments: {parsed_submission.num_comments}")
                print(f"Author: {parsed_submission.author}")
                print(f"Created: {parsed_submission.created_datetime.strftime('%Y-%m-%d %H:%M:%S')}")
                if parsed_submission.selftext:
                    print(f"Content: {parsed_submission.selftext[:200]}...")
                print("-" * 80)
                
                if submission_count >= 50:
                    print("Reached 50 submissions, stopping...")
                    break
                    
            except Exception as e:
                print(f"Error parsing submission: {e}")
                continue
                
    except KeyboardInterrupt:
        print(f"\nStopped by user after {submission_count} submissions")
    except Exception as e:
        print(f"Error in stream: {e}")
    finally:
        try:
            reddit = reddit_client.get_client()
            await reddit.close()
            print("Reddit client connection closed")
        except Exception as e:
            print(f"Error closing Reddit client: {e}")
    
    return submissions

if __name__ == "__main__":
    asyncio.run(stream_past_submissions())
