from fastapi import HTTPException
import aiohttp
from bs4 import BeautifulSoup
import re
import logging
from urllib.parse import urlparse, ParseResult
from typing import Optional


def validate_url(url: str) -> str:
    """Validate and normalize URL format."""
    if not url or not url.strip():
        raise ValueError("URL cannot be empty")
    
    url = url.strip()
    
    # Parse URL to validate format
    parsed: ParseResult = urlparse(url)
    
    # Add scheme if missing
    if not parsed.scheme:
        url = "https://" + url
        parsed = urlparse(url)
    
    # Validate scheme
    if parsed.scheme not in ('http', 'https'):
        raise ValueError(f"Unsupported URL scheme: {parsed.scheme}")
    
    # Validate netloc (domain)
    if not parsed.netloc:
        raise ValueError("Invalid URL: missing domain")
    
    return url


async def fetch_html(url: str) -> str:
    logger = logging.getLogger(__name__)
    
    try:
        # Validate URL format first
        validated_url = validate_url(url)
        logger.info(f"Fetching HTML from: {validated_url}")
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(validated_url, headers=headers, timeout=aiohttp.ClientTimeout(total=15)) as response:
                    logger.info(f"HTTP response status: {response.status} for URL: {validated_url}")
                    
                    if response.status == 200:
                        content = await response.text()
                        logger.info(f"Successfully fetched {len(content)} characters from {validated_url}")
                        return content
                    else:
                        error_msg = f"HTTP {response.status} error for URL: {validated_url}"
                        if response.status == 404:
                            error_msg += " (Page not found)"
                        elif response.status == 403:
                            error_msg += " (Access forbidden)"
                        elif response.status == 429:
                            error_msg += " (Rate limited)"
                        elif response.status >= 500:
                            error_msg += " (Server error)"
                        
                        logger.error(error_msg)
                        raise HTTPException(status_code=400, detail=error_msg)
                        
            except aiohttp.ClientTimeout:
                error_msg = f"Request timeout (15s) for URL: {validated_url}"
                logger.error(error_msg)
                raise HTTPException(status_code=400, detail=error_msg)
            
            except aiohttp.ClientConnectorError as e:
                error_msg = f"Connection failed for URL: {validated_url} - {str(e)}"
                logger.error(error_msg)
                raise HTTPException(status_code=400, detail=error_msg)
            
            except aiohttp.ClientResponseError as e:
                error_msg = f"Response error for URL: {validated_url} - HTTP {e.status}: {e.message}"
                logger.error(error_msg)
                raise HTTPException(status_code=400, detail=error_msg)
            
            except aiohttp.ClientSSLError as e:
                error_msg = f"SSL error for URL: {validated_url} - {str(e)}"
                logger.error(error_msg)
                raise HTTPException(status_code=400, detail=error_msg)
                
    except ValueError as e:
        error_msg = f"Invalid URL format: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
        
    except HTTPException:
        # Re-raise HTTPExceptions as-is
        raise
        
    except Exception as e:
        error_msg = f"Unexpected error fetching URL {url}: {type(e).__name__}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail=error_msg)


def parse_html_content(html: str) -> str:
    logger = logging.getLogger(__name__)
    
    if not html or not html.strip():
        error_msg = "Cannot parse empty HTML content"
        logger.error(error_msg)
        raise HTTPException(status_code=400, detail=error_msg)
    
    try:
        logger.info(f"Parsing HTML content ({len(html)} characters)")
        
        # Parse HTML with BeautifulSoup
        try:
            soup = BeautifulSoup(html, "lxml")
        except Exception as e:
            logger.warning(f"Failed to parse with lxml, falling back to html.parser: {e}")
            soup = BeautifulSoup(html, "html.parser")
        
        # Remove unwanted elements
        removed_count = 0
        for script in soup(["script", "style", "nav", "header", "footer", "aside"]):
            script.decompose()
            removed_count += 1
        logger.debug(f"Removed {removed_count} unwanted HTML elements")
        
        # Extract title
        title = soup.find("title")
        title_text = title.get_text().strip() if title else ""
        logger.debug(f"Extracted title: {title_text[:100]}..." if len(title_text) > 100 else f"Extracted title: {title_text}")
        
        # Extract meta description
        meta_desc = soup.find("meta", attrs={"name": "description"})
        description = meta_desc.get("content", "").strip() if meta_desc else ""
        logger.debug(f"Extracted meta description: {description[:100]}..." if len(description) > 100 else f"Extracted meta description: {description}")
        
        # Extract headings
        headings = []
        for heading in soup.find_all(["h1", "h2", "h3"]):
            text = heading.get_text().strip()
            if text:
                headings.append(text)
        logger.debug(f"Extracted {len(headings)} headings")
        
        # Extract main content using various selectors
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
        selector_used = None
        
        for selector in content_selectors:
            try:
                content_elem = soup.select_one(selector)
                if content_elem:
                    main_content = content_elem.get_text(separator=" ", strip=True)
                    selector_used = selector
                    break
            except Exception as e:
                logger.warning(f"Error with selector '{selector}': {e}")
                continue
        
        # Fallback to body if no main content found
        if not main_content:
            body = soup.find("body")
            if body:
                main_content = body.get_text(separator=" ", strip=True)
                selector_used = "body"
            else:
                logger.warning("No body element found, using entire document")
                main_content = soup.get_text(separator=" ", strip=True)
                selector_used = "document"
        
        logger.debug(f"Extracted main content using selector '{selector_used}': {len(main_content)} characters")
        
        # Clean up whitespace
        main_content = re.sub(r"\s+", " ", main_content).strip()
        
        # Combine all extracted content
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
        
        result = "\n\n".join(combined_text)
        
        if not result.strip():
            error_msg = "No meaningful content could be extracted from HTML"
            logger.error(error_msg)
            raise HTTPException(status_code=400, detail=error_msg)
        
        logger.info(f"Successfully parsed HTML content: {len(result)} characters extracted")
        return result
        
    except HTTPException:
        # Re-raise HTTPExceptions as-is
        raise
        
    except Exception as e:
        error_msg = f"Failed to parse HTML content: {type(e).__name__}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail=error_msg)
