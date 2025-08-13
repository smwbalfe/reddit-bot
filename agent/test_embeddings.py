#!/usr/bin/env python3

from scraper.embeddings.openai_embeddings_service import embeddings_service

def test_embeddings_filtering():
    """Test the embeddings prefilter with sample data"""
    
    # Sample ICP description (similar to your provided code)
    icp_description = """
    SubLead helps you stop missing customers that are ready to buy on Reddit. Just describe your ideal buyer in plain English and our AI delivers qualified leads to your inbox daily. Ideal users are founders, marketers, or sales teams looking to find and engage with prospects on Reddit, especially those seeking lead generation, customer discovery, or social listening tools. They want to track customer mentions, find leads on social media, and get recommendations for lead generation tools. They value confidence scoring, AI-powered scanning, and personalized replies to maximize their outreach and conversion.
    """
    
    # Test posts
    matching_posts = [
        "How do I know when people are talking about my business? I want to be aware when discussions relevant to my company happen online, so I can respond quickly.",
        "Finding people interested in my product Is there a way to discover users who might be looking for what I offer, even if they don't mention it directly?",
        "Tools for understanding what users want Are there solutions that help me spot opportunities to engage with people who have needs my business addresses?",
    ]
    
    non_matching_posts = [
        "How to grow a YouTube channel? Looking for tips to increase subscribers and views.",
        "Best CRM for small business What CRM do you recommend for a 3-person team?",
        "Office chair recommendations Need a comfortable chair for long work sessions.",
    ]
    
    print("=== Testing OpenAI Embeddings Prefilter ===")
    print(f"ICP Description: {icp_description.strip()[:100]}...")
    print(f"\nTesting with threshold: 35%\n")
    
    print("MATCHING POSTS (should pass filter):")
    for i, post_text in enumerate(matching_posts):
        passes_filter, similarity_score = embeddings_service.check_similarity(
            post_text, icp_description, threshold=35.0
        )
        status = "✅ PASS" if passes_filter else "❌ FAIL"
        print(f"{status} ({similarity_score:.1f}%): {post_text[:80]}...")
    
    print(f"\nNON-MATCHING POSTS (should not pass filter):")
    for i, post_text in enumerate(non_matching_posts):
        passes_filter, similarity_score = embeddings_service.check_similarity(
            post_text, icp_description, threshold=35.0
        )
        status = "✅ PASS" if passes_filter else "❌ FAIL"
        print(f"{status} ({similarity_score:.1f}%): {post_text[:80]}...")

if __name__ == "__main__":
    test_embeddings_filtering()