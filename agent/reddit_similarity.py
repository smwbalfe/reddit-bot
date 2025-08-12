#!/usr/bin/env python3
"""
Simple Reddit post similarity checker using vector embeddings and cosine similarity.
"""

import numpy as np
import praw
from google import genai
from google.genai import types
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Tuple
import os


class RedditSimilarityChecker:
    def __init__(self, client_id: str, client_secret: str, user_agent: str, gemini_api_key: str = None):
        self.reddit = praw.Reddit(
            client_id=client_id,
            client_secret=client_secret,
            user_agent=user_agent
        )
        
        # Initialize Gemini client
        print("Initializing Gemini embedding client...")
        if gemini_api_key:
            genai.configure(api_key=gemini_api_key)
        else:
            # Try to get API key from environment
            api_key = os.getenv('GEMINI_API_KEY')
            if not api_key:
                raise ValueError("Gemini API key is required. Set GEMINI_API_KEY environment variable or pass as parameter.")
            genai.configure(api_key=api_key)
        
        self.client = genai.Client()
        
    def get_reddit_stream(self, subreddit_name: str, limit: int = 10) -> List[Dict]:
        """Get recent posts from a subreddit."""
        posts = []
        subreddit = self.reddit.subreddit(subreddit_name)
        
        print(f"Fetching {limit} posts from r/{subreddit_name}...")
        for submission in subreddit.new(limit=limit):
            post_text = f"{submission.title} {submission.selftext}"
            posts.append({
                'id': submission.id,
                'title': submission.title,
                'text': post_text,
                'url': submission.url,
                'score': submission.score
            })
        
        return posts
    
    def compute_embeddings(self, texts: List[str]) -> np.ndarray:
        """Compute embeddings for a list of texts using Gemini embedding API."""
        print(f"Computing embeddings for {len(texts)} texts using Gemini...")
        
        result = self.client.models.embed_content(
            model="gemini-embedding-001",
            contents=texts,
            config=types.EmbedContentConfig(
                task_type="SEMANTIC_SIMILARITY",
                output_dimensionality=768
            )
        )
        
        # Convert to numpy array and normalize
        embeddings = []
        for embedding_obj in result.embeddings:
            embedding_values = np.array(embedding_obj.values)
            # Normalize for better semantic similarity
            normalized_embedding = embedding_values / np.linalg.norm(embedding_values)
            embeddings.append(normalized_embedding)
        
        return np.array(embeddings)
    
    def find_similar_posts(self, 
                          posts: List[Dict], 
                          target_text: str, 
                          threshold: float = 0.5) -> List[Tuple[Dict, float]]:
        """Find posts similar to target text using cosine similarity."""
        
        # Prepare all texts for embedding
        post_texts = [post['text'] for post in posts]
        all_texts = post_texts + [target_text]
        
        # Compute embeddings
        print("Computing embeddings...")
        embeddings = self.compute_embeddings(all_texts)
        
        # Separate target embedding from post embeddings
        post_embeddings = embeddings[:-1]
        target_embedding = embeddings[-1].reshape(1, -1)
        
        # Calculate cosine similarities
        similarities = cosine_similarity(target_embedding, post_embeddings)[0]
        
        # Filter by threshold and sort by similarity
        similar_posts = []
        for i, similarity in enumerate(similarities):
            if similarity >= threshold:
                similar_posts.append((posts[i], similarity))
        
        # Sort by similarity (descending)
        similar_posts.sort(key=lambda x: x[1], reverse=True)
        
        return similar_posts
    
    def print_results(self, similar_posts: List[Tuple[Dict, float]], target_text: str):
        """Print similarity results in a readable format."""
        print(f"\nTarget text: '{target_text[:100]}...'")
        print(f"Found {len(similar_posts)} similar posts:\n")
        
        for i, (post, similarity) in enumerate(similar_posts, 1):
            print(f"{i}. Similarity: {similarity:.3f}")
            print(f"   Title: {post['title']}")
            print(f"   Score: {post['score']}")
            print(f"   Text preview: {post['text'][:150]}...")
            print(f"   URL: {post['url']}")
            print("-" * 50)


def main():
    # Configuration
    CLIENT_ID = "edbo15WRR2klNZfn4l9i2g"
    CLIENT_SECRET = "8DDSqMklHLK7btPfD6NY0gLp7yYHjg"
    USER_AGENT = os.getenv('REDDIT_USER_AGENT', 'similarity_checker/1.0')
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    
    # Initialize checker
    checker = RedditSimilarityChecker(CLIENT_ID, CLIENT_SECRET, USER_AGENT, GEMINI_API_KEY)
    
    # Example usage
    subreddit_name = "python"  # Change this to your desired subreddit
    target_text = "How to use machine learning for text classification and sentiment analysis"
    similarity_threshold = 0.3  # Adjust as needed (0.0 to 1.0)
    
    try:
        # Get Reddit posts
        posts = checker.get_reddit_stream(subreddit_name, limit=20)
        
        # Find similar posts
        similar_posts = checker.find_similar_posts(posts, target_text, similarity_threshold)
        
        # Print results
        checker.print_results(similar_posts, target_text)
        
    except Exception as e:
        print(f"Error: {e}")
        print("Make sure to set your Reddit API credentials in environment variables:")
        print("REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT")


if __name__ == "__main__":
    main()