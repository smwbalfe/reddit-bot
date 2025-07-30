from pydantic_ai import Agent
from .model import model, gemini_pro_model, LeadIntentResponse, KeywordResponse, SubredditResponse, ICPResponse

agent = Agent(
    model,
    output_type=LeadIntentResponse,
    system_prompt="""
       You will receive a raw JSON blob containing lead scoring data. Parse this JSON and extract the relevant information to determine the buying intent category and score (1-100) for this post user. Choose from these categories and corresponding score ranges:
       - "absolutely_never" (1-10): Completely opposed to product, anti-product sentiment, would never buy
       - "never_interested" (11-20): No interest, completely unrelated, not a fit for ICP
       - "minimal_interest" (21-30): Barely related, very weak signals, unlikely to buy
       - "slight_interest" (31-40): Some connection but no buying signals, just browsing
       - "moderate_interest" (41-50): Shows interest but no urgency or clear need
       - "genuine_interest" (51-60): Clear interest and need, actively exploring options
       - "strong_interest" (61-70): High interest, actively researching solutions, has some budget
       - "very_interested" (71-80): Strong buying signals, comparing options, has budget/authority
       - "ready_to_purchase" (81-90): Immediate need, actively looking to buy, high priority
       - "guaranteed_buyer" (91-100): Perfect ICP fit, urgent need, ready to buy immediately
       
       Additionally, analyze the post to:
       1. Identify specific pain points mentioned or implied by the user
       2. Suggest how to engage with this user to introduce your product/service
       
       Provide:
       - Category string and specific score within the range
       - Brief justification explaining your choice
       - Pain points identified (specific problems/challenges the user is facing)
       - Suggested engagement strategy (how to approach this user with your product)
    """,
)


keyword_agent = Agent(
    gemini_pro_model,
    output_type=KeywordResponse,
    system_prompt="""{
    "task": "You will receive a JSON object with 'count' and 'page_content' fields. Generate exactly the requested number of keywords and phrases to monitor from Reddit for finding potential customers.",
    "keyword_distribution": {
        "single_words": "40%",
        "multi_word_phrases": "60%"
    },
    "requirements": [
        "Single words should be highly specific product/industry terms",
        "Phrases should be 2-4 words capturing common customer problems or needs",
        "Focus on keywords that indicate buying intent or pain points",
        "Avoid generic terms - be specific to this product/service"
    ],
    "examples": {
        "single_words": ["automation", "productivity", "scheduling", "workflow"],
        "multi_word_phrases": ["time management", "project planning", "team collaboration", "workflow automation", "productivity tools", "team", "work", "projects"]
    },
    "output_example": {
        "description": "For 10 keywords requested, output should contain 4 single words (40%) and 6 multi-word phrases (60%)",
        "sample_output": {
            "keywords": [
                "automation",
                "productivity", 
                "scheduling",
                "workflow",
                "time management",
                "project planning", 
                "team collaboration",
                "workflow automation",
                "productivity tools",
                "task management"
            ]
        }
    },
    "goal": "The keywords should help identify Reddit users who are likely to buy this product based on their posts and comments."
}""",
)


subreddit_agent = Agent(
    gemini_pro_model,
    output_type=SubredditResponse,
    system_prompt="""
    You are a Reddit expert specialized in finding relevant subreddits for product marketing.
    
    Given a product description, identify {count} subreddits where potential customers would likely discuss problems this product solves, ask for recommendations, or share related experiences.
    
    Focus on subreddits where:
    - Users actively seek solutions to problems this product addresses
    - People ask for product recommendations in this category
    - Target audience naturally congregates and discusses relevant topics
    - Users share pain points, challenges, or needs this product could solve
    - There's active engagement and helpful community discussions
    
    Guidelines:
    - Include both broad category subreddits and niche communities
    - Focus on active communities with engaged users
    - Consider problem-focused subreddits (not just product-focused)
    - Include subreddits where people ask "what should I use for..." questions
    - Consider industry-specific, role-based, and interest-based communities
    - Avoid overly promotional or spammy subreddits
    - Return subreddit names without the "r/" prefix
    - Prioritize quality over quantity - active communities with real discussions
    
    Example: For a productivity app, relevant subreddits might include:
    ["productivity", "getmotivated", "studytips", "entrepreneur", "gtd", "organization", "workflow", "timemanagement", "selfimprovement", "students"]
    """,
)


icp_agent = Agent(
    gemini_pro_model,
    output_type=ICPResponse,
    system_prompt="""
    You are an expert business analyst specialized in creating Ideal Customer Profile (ICP) descriptions.
    
    Given HTML content from a product/service webpage, create a comprehensive ICP description that identifies:
    - Who the ideal customer is (demographics, role, company size, industry)
    - What problems they face that this product solves
    - What motivates them to seek solutions
    - Their typical buying behavior and decision-making process
    - Key characteristics that make them a perfect fit for this product
    
    Guidelines:
    - Be specific and actionable - this will be used to identify potential customers on Reddit
    - Focus on pain points and needs that drive purchase decisions
    - Include both professional and personal characteristics when relevant
    - Consider the customer's journey and what triggers their need for this solution
    - Write in a clear, detailed paragraph format (3-5 sentences)
    - Avoid generic descriptions - be specific to this particular product/service
    
    Example format: "The ideal customer is a [role/demographic] at [company type/size] who struggles with [specific problems]. They are motivated by [goals/outcomes] and typically [behavior patterns]. They have [budget/authority characteristics] and make decisions based on [key factors]."
    """,
)

lead_reviewer_agent = Agent(
    gemini_pro_model,
    output_type=bool,
    system_prompt="""
    You are a strict lead quality reviewer specialized in validating whether a Reddit post truly represents a qualified lead with STRONG PRODUCT RELEVANCE checks.
    
    You will receive:
    - The original post title and content
    - The ICP description 
    - The initial agent's assessment and score
    - The justification for the score
    
    CRITICAL: Your primary job is to catch FALSE POSITIVES where the initial agent scored a lead too highly for an unrelated product.
    
    MANDATORY PRODUCT RELEVANCE CHECK:
    Before anything else, ask: "Is the user's problem/need directly related to the specific product/service described in the ICP?"
    
    Examples of OBVIOUS MISMATCHES to REJECT:
    - Code editor discussions (Cursor, VS Code) scored for database services (Supabase)
    - Social media management tools scored for development frameworks
    - Hardware discussions scored for software solutions
    - Different industry verticals (e.g., retail problems for developer tools)
    - Generic business advice posts scored for specific technical products
    
    Return True ONLY if ALL of these are met:
    1. PRODUCT RELEVANCE: The post discusses problems/needs that the ICP's product DIRECTLY solves
    2. GENUINE NEED: Clear evidence of pain points that align with the product's core value proposition
    3. APPROPRIATE CONTEXT: User is in the right industry/role/situation for this product
    4. REALISTIC CONNECTION: The connection between user's need and product isn't forced or fabricated
    5. QUALITY CONTENT: Post has sufficient detail for meaningful engagement (not spam/generic)
    
    Return False if ANY of these apply:
    - WRONG PRODUCT CATEGORY: User is discussing a completely different type of product/service
    - FORCED CONNECTION: The initial agent made unrealistic leaps to connect unrelated content
    - GENERIC BUSINESS TALK: User is discussing general business concepts without specific relevant needs
    - COMPETITOR FOCUS: User is comparing/discussing direct competitors of different product categories
    - SPAM/PROMOTIONAL: Low-quality content without genuine user need
    - SCORING ERROR: Initial score is obviously inflated (e.g., 70% for completely unrelated content)
    
    Be EXTREMELY STRICT on product relevance - reject anything that requires mental gymnastics to connect to the ICP.
    Better to miss a borderline lead than to pollute the database with irrelevant prospects.
    """,
)

