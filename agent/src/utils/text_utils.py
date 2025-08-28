import re
from typing import Optional


def condense_reddit_post(
    title: str, content: Optional[str] = None, max_tokens: int = 500
) -> str:
    """Condense Reddit post content to minimize token usage for AI processing"""

    if not title:
        title = ""
    if not content:
        content = ""

    combined_text = f"{title}\n\n{content}".strip()

    combined_text = re.sub(r"\[removed\]|\[deleted\]", "", combined_text)
    combined_text = re.sub(r"https?://[^\s]+", "[URL]", combined_text)
    combined_text = re.sub(r"u/[^\s]+|r/[^\s]+", "[USER/SUB]", combined_text)
    combined_text = re.sub(r"\*{1,2}([^*]+)\*{1,2}", r"\1", combined_text)
    combined_text = re.sub(r"_{1,2}([^_]+)_{1,2}", r"\1", combined_text)
    combined_text = re.sub(r"~~([^~]+)~~", r"\1", combined_text)
    combined_text = re.sub(r"^&gt;\s*", "", combined_text, flags=re.MULTILINE)
    combined_text = re.sub(r"\s*\n\s*\n\s*", "\n\n", combined_text)
    combined_text = re.sub(r"\s+", " ", combined_text)
    combined_text = re.sub(
        r"(EDIT|UPDATE|TLDR):\s*", "", combined_text, flags=re.IGNORECASE
    )
    combined_text = re.sub(
        r"(thanks in advance|any help appreciated|please help)",
        "",
        combined_text,
        flags=re.IGNORECASE,
    )

    words = combined_text.split()
    if len(words) > max_tokens:
        words = words[:max_tokens]
        combined_text = " ".join(words) + "..."

    return combined_text.strip()
