from openai import OpenAI
import numpy as np
from dotenv import load_dotenv
import os
import logging

load_dotenv()
logger = logging.getLogger(__name__)


class OpenAIEmbeddingsService:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")
        self.client = OpenAI(api_key=api_key)

    def get_embeddings(self, texts, model="text-embedding-3-large"):
        """Get embeddings for a list of texts"""
        try:
            response = self.client.embeddings.create(input=texts, model=model)
            embeddings = [embedding.embedding for embedding in response.data]
            return embeddings
        except Exception as e:
            logger.error(f"Error getting embeddings: {e}")
            return None

    def cosine_similarity(self, a, b):
        """Calculate cosine similarity between two vectors"""
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

    def check_similarity(self, post_text, target_text, threshold=35.0):
        """Check if post text is similar enough to target text based on threshold"""
        embeddings = self.get_embeddings([post_text, target_text])
        if not embeddings or len(embeddings) != 2:
            logger.warning("Failed to get embeddings for similarity check")
            return False, 0.0

        embedding1, embedding2 = embeddings[0], embeddings[1]
        similarity = self.cosine_similarity(embedding1, embedding2)
        similarity_percentage = similarity * 100

        logger.debug(f"Similarity: {similarity_percentage:.1f}%")
        return similarity_percentage >= threshold, similarity_percentage


embeddings_service = OpenAIEmbeddingsService()
