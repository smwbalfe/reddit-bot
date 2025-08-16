from fastapi import HTTPException
import aiohttp
from bs4 import BeautifulSoup
import re
from urllib.parse import urlparse


async def fetch_html(url: str) -> str:
    try:
        if not urlparse(url).scheme:
            url = "https://" + url
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, timeout=10) as response:
                if response.status == 200:
                    return await response.text()
                else:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Failed to fetch URL: HTTP {response.status}",
                    )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")


def parse_html_content(html: str) -> str:
    try:
        soup = BeautifulSoup(html, "lxml")
        for script in soup(["script", "style", "nav", "header", "footer", "aside"]):
            script.decompose()
        title = soup.find("title")
        title_text = title.get_text().strip() if title else ""
        meta_desc = soup.find("meta", attrs={"name": "description"})
        description = meta_desc.get("content", "").strip() if meta_desc else ""
        headings = []
        for heading in soup.find_all(["h1", "h2", "h3"]):
            text = heading.get_text().strip()
            if text:
                headings.append(text)
        content_selectors = [
            "main",
            "article",
            ".content",
            "#content",
            ".post",
            ".entry",
            ".article-content",
            ".post-content",
            '[role="main"]',
        ]
        main_content = ""
        for selector in content_selectors:
            content_elem = soup.select_one(selector)
            if content_elem:
                main_content = content_elem.get_text(separator=" ", strip=True)
                break
        if not main_content:
            body = soup.find("body")
            if body:
                main_content = body.get_text(separator=" ", strip=True)
        main_content = re.sub(r"\s+", " ", main_content).strip()
        combined_text = []
        if title_text:
            combined_text.append(f"Title: {title_text}")
        if description:
            combined_text.append(f"Description: {description}")
        if headings:
            combined_text.append(f"Headings: {' | '.join(headings[:5])}")
        if main_content:
            content_preview = (
                main_content[:2000] + "..."
                if len(main_content) > 2000
                else main_content
            )
            combined_text.append(f"Content: {content_preview}")
        return "\n\n".join(combined_text)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to parse HTML content: {str(e)}"
        )
