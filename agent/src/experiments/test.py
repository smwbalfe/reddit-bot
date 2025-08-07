import asyncio
from typing import List, Tuple
from collections import Counter
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.reddit.client import RedditClient

async def find_subreddits_by_keywords(keywords: List[str], limit: int = 100, min_subscribers: int = 1000) -> List[Tuple[str, int, int, str, List[str]]]:
    reddit_client = RedditClient()
    subreddit_counts = Counter()
    subreddit_subscribers = {}
    subreddit_descriptions = {}
    subreddit_sample_posts = {}

    try:
        for keyword in keywords:
            print(f"Searching for keyword: {keyword}")
            async for subreddit in reddit_client.get_client().subreddits.search(keyword, limit=limit):
                if subreddit.subscribers and subreddit.subscribers >= min_subscribers:
                    subreddit_counts[subreddit.display_name] += 1
                    subreddit_subscribers[subreddit.display_name] = subreddit.subscribers
                    subreddit_descriptions[subreddit.display_name] = subreddit.public_description or ""
                    
                    if subreddit.display_name not in subreddit_sample_posts:
                        subreddit_sample_posts[subreddit.display_name] = []

        top_5_subreddits = [name for name, count in subreddit_counts.most_common(5)]
        for subreddit_name in top_5_subreddits:
            print(f"Searching posts in r/{subreddit_name}")
            try:
                subreddit = await reddit_client.get_subreddit(subreddit_name)
                for keyword in keywords:
                    if len(subreddit_sample_posts[subreddit_name]) >= 3:
                        break
                    try:
                        async for post in subreddit.search(keyword, limit=10):
                            if len(subreddit_sample_posts[subreddit_name]) >= 3:
                                break
                            subreddit_sample_posts[subreddit_name].append(f"'{post.title}' - {keyword}")
                    except Exception as e:
                        print(f"Error searching '{keyword}' in r/{subreddit_name}: {e}")
            except Exception as e:
                print(f"Error accessing r/{subreddit_name}: {e}")

        top_subreddits = [
            (name, count, subreddit_subscribers[name], subreddit_descriptions[name], subreddit_sample_posts.get(name, []))
            for name, count in subreddit_counts.most_common(10)
        ]
        return sorted(top_subreddits, key=lambda x: x[2], reverse=True)

    except Exception as e:
        print(f"Error searching subreddits: {e}")
        return []

async def main():
    keywords = [
        "lead generation tool",
        "find customers reddit",
        "reddit marketing tool",
        "social media monitoring",
        "track brand mentions",
        "reddit lead discovery",
        "customer acquisition",
        "prospecting tool",
        "reddit scraping",
        "social listening",
        "reddit automation",
        "lead qualification",
        "reddit outreach",
        "customer research tool",
        "reddit sales",
        "social media leads",
        "reddit prospect",
        "mention tracking",
        "reddit business",
        "cold outreach alternative",
        "reddit advertising",
        "social selling",
        "reddit marketing strategy",
        "lead scoring",
        "reddit engagement"
    ]
    
    print(f"Searching for subreddits using keywords: {keywords}")
    results = await find_subreddits_by_keywords(keywords)
    
    print(f"\nFound {len(results)} subreddits:")
    print("=" * 120)
    
    for name, count, subscribers, description, sample_posts in results[:10]:
        desc_truncated = description[:80] + "..." if len(description) > 80 else description
        print(f"\nr/{name} - {subscribers:,} subscribers ({count} keyword matches)")
        print(f"Description: {desc_truncated}")
        
        if sample_posts:
            print("Sample matched posts:")
            for post in sample_posts[:3]:
                print(f"  • {post}")
        else:
            print("  • No sample posts found")
        print("-" * 120)

if __name__ == "__main__":
    asyncio.run(main())
