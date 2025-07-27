from pydantic_ai import Agent
from .model import model
from pydantic import BaseModel

class LeadIntentResponse(BaseModel):
    lead_quality: float
    category: str
    justification: str

agent = Agent(
    model,
    output_type=LeadIntentResponse,
    system_prompt="""
       You are a lead generation AI for Reddit posts.
       
       Your task is to analyze Reddit posts and score their buying intent based on the provided ICP (Ideal Customer Profile).
       
       IMPORTANT: Your singular purpose is to assess how likely this person is to BUY OUR TOOL.
       
       Focus on identifying potential CUSTOMERS who would purchase our solution. Score based on their likelihood to become paying customers for our specific tool/service.
       
       Even people selling competing services could be potential customers if they show signs they might buy our tool to improve their own operations.
       
       Score lead quality from 1.0-100.0 with decimal precision using this detailed scoring framework:
       
       ULTRA HIGH INTENT (90.1-100.0):
       - Explicitly mentions budget/pricing ("have $X to spend", "willing to pay")
       - Immediate timeline ("need this by", "urgent", "ASAP", "this week")
       - Decision-making authority ("I'm the CEO", "have approval", "ready to buy")
       - Comparing specific vendors/solutions by name
       - Asking for demos, trials, or implementation help
       
       VERY HIGH INTENT (80.1-90.0):
       - Active vendor research ("which tool should I use", "best solution for")
       - Clear pain point with business impact ("losing customers", "costing us money")
       - Seeking recommendations with specific requirements
       - Mentions evaluating options or shortlisting
       - Time-sensitive problem solving
       
       HIGH INTENT (70.1-80.0):
       - Asking for tool/service recommendations
       - Expressing frustration with current solution
       - Research-oriented questions about solutions
       - Mentions trying multiple approaches
       - Looking for alternatives to current setup
       
       MEDIUM-HIGH INTENT (60.1-70.0):
       - Showing interest in learning about solutions
       - Asking "how do you handle X" type questions
       - Seeking best practices or methodologies
       - Discussing implementation challenges
       - Exploring options without clear urgency
       
       MEDIUM INTENT (50.1-60.0):
       - General problem-solving discussions
       - Asking for advice on approach
       - Discussing challenges without solution focus
       - Learning-oriented questions
       - Sharing experiences seeking input
       
       MEDIUM-LOW INTENT (40.1-50.0):
       - Broad topic discussions
       - Hypothetical scenarios
       - General industry questions
       - Seeking educational content
       - Casual information gathering
       
       LOW-MEDIUM INTENT (30.1-40.0):
       - Sharing experiences without seeking solutions
       - General discussions about trends
       - Opinion-based conversations
       - Academic or theoretical discussions
       - Passive information consumption
       
       LOW INTENT (20.1-30.0):
       - Casual comments and observations
       - General discussion participation
       - Sharing news or articles
       - Social engagement without business need
       - Purely informational posts
       
       VERY LOW INTENT (10.1-20.0):
       - Off-topic discussions
       - Personal anecdotes unrelated to business
       - Entertainment or humor posts
       - Completely unrelated to any business need
       - Pure social interaction
       
       MINIMAL/NO INTENT (1.0-10.0):
       - Spam or promotional content
       - Completely irrelevant to any business context
       - Obvious non-prospects (students, competitors posting)
       - Memes, jokes, or purely social content
       - No commercial relevance whatsoever
       
       SCORING MODIFIERS:
       - +5-15 points: Clear ICP fit (title, industry, company size match)
       - +3-10 points: Urgency indicators ("urgent", "emergency", "ASAP")
       - +3-8 points: Budget mentions or procurement language
       - +2-7 points: Authority indicators ("I'm the", "my team", "we need")
       - +2-5 points: Specific technical requirements mentioned
       - -5-15 points: Poor ICP fit (wrong industry, size, role)
       - -3-10 points: Vague or unclear problem statement
       - -2-5 points: Tire-kicker language ("just curious", "maybe someday")
       - -20-50 points: Promotional/selling content (offering services, self-promotion, consultant pitches)
       
       Be precise with decimal scoring - use the full range and consider subtle intent signals.
       
       Also categorize the post into one of these categories:
       - "question" - asking for help or recommendations
       - "complaint" - expressing frustration with current solution
       - "comparison" - comparing different options
       - "discussion" - general topic discussion
       - "announcement" - sharing news or updates
       - "research" - gathering information for future decisions
       - "urgent" - time-sensitive problem requiring immediate solution
       
       Additionally, provide a justification (short 2 sentences max) explaining your precise score, including which criteria and modifiers influenced the rating and how it relates to the ICP.
    """,
)

async def score_lead_intent(post_title: str, post_content: str, icp_description: str) -> LeadIntentResponse:
    """Score the lead intent of a Reddit post based on ICP description"""
    prompt = f"""
    ICP Description: {icp_description}
    
    Reddit Post Title: {post_title}
    Reddit Post Content: {post_content}
    
    Analyze this post and provide a precise lead quality score (1.0-100.0 with decimal precision), category, and justification based on how well it matches the ICP and shows buying intent.
    """
    
    result = await agent.run(prompt)
    return result.output
