"""
In-House Scraping Engine for Atheris Competitive Intelligence.

Tiered Extraction Hierarchy:
  1. TIER 1: In-House Scrapling Engine
     - High-speed, stealth browser/HTTP engine
     - Bypasses Cloudflare Turnstile, Akamai, and anti-bot WAFs
     - Adaptive element matching that adjusts to DOM redesigns
     - Zero third-party API costs; runs locally on our servers.
  2. TIER 2: In-House Direct HTTP + DOM Hierarchy Sanitizer
     - Fast asynchronous HTTP engine with rotated modern desktop headers
     - BeautifulSoup/lxml cleaning (stripping scripts, popups, styles, SVGs)
     - Preserves H1, H2, H3 heading trees for downstream TF-IDF salience.
  3. TIER 3: Managed Cloud Fallback (Jina Reader)
     - Engaged only if local in-house scrapers encounter heavy enterprise CAPTCHAs.

Includes `crawl_and_scrape_competitor(base_url)` combining the InHouseCrawler
with multi-page intelligence extraction.
"""

import asyncio
import logging
import re
from typing import Dict, Any, Optional

import httpx
from bs4 import BeautifulSoup

from config import JINA_API_KEY
from inhouse_crawler import InHouseCrawler

logger = logging.getLogger(__name__)

JINA_BASE = "https://r.jina.ai/"

JINA_HEADERS = {
    "Accept": "text/markdown",
    "X-Return-Format": "markdown",
    "X-Remove-Selector": "header, footer, nav, .cookie-banner, .popup, script, style",
    "X-Retain-Images": "none",
}
if JINA_API_KEY:
    JINA_HEADERS["Authorization"] = f"Bearer {JINA_API_KEY}"


def _sanitize_html_to_markdown(html_content: str, preserve_headings: bool = True) -> str:
    """Clean raw HTML into structured, high-density text for NLP processing."""
    soup = BeautifulSoup(html_content, "html.parser")

    # Decompose script, style, navigation, footer, and interactive clutter
    for el in soup(["script", "style", "nav", "footer", "header", "noscript", "svg", "form", "iframe"]):
        el.decompose()

    # Clean cookie banners and modal overlays
    for modal in soup.find_all(class_=re.compile(r"cookie|modal|banner|popup|consent", re.I)):
        modal.decompose()

    # Format headings to preserve hierarchy for TF-IDF / Flagship extraction
    if preserve_headings:
        for h1 in soup.find_all("h1"):
            h1.string = f"\n# {h1.get_text().strip()}\n"
        for h2 in soup.find_all("h2"):
            h2.string = f"\n## {h2.get_text().strip()}\n"
        for h3 in soup.find_all("h3"):
            h3.string = f"\n### {h3.get_text().strip()}\n"

    text = soup.get_text(separator="\n", strip=True)
    # Collapse multiple consecutive blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


async def _scrape_with_scrapling(url: str) -> Optional[str]:
    """
    TIER 1: In-House Scrapling Engine.
    Executes stealth extraction with anti-bot fingerprinting.
    """
    try:
        # Dynamically import Scrapling
        from scrapling import Fetcher
        
        # Scrapling executes stealth requests in a worker thread to prevent event loop blocking
        loop = asyncio.get_running_loop()
        def _fetch_sync():
            fetcher = Fetcher()
            page = fetcher.get(url, stealth=True, timeout=20)
            return page.text or ""

        raw_text = await loop.run_in_executor(None, _fetch_sync)
        if raw_text and len(raw_text.strip()) > 80:
            logger.info("[Tier 1 - Scrapling] Successfully scraped %s (%d chars)", url, len(raw_text))
            return _sanitize_html_to_markdown(raw_text)
    except ImportError:
        logger.debug("[Tier 1 - Scrapling] Scrapling library not installed locally. Advancing to Tier 2.")
    except Exception as exc:
        logger.warning("[Tier 1 - Scrapling] In-house Scrapling failed for %s (%s). Advancing to Tier 2.", url, exc)
    
    return None


async def _scrape_direct_http(url: str) -> Optional[str]:
    """
    TIER 2: In-House Asynchronous HTTP Engine.
    Employs real browser headers and custom DOM parser.
    """
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
    }
    try:
        async with httpx.AsyncClient(timeout=25, follow_redirects=True, verify=False) as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                cleaned = _sanitize_html_to_markdown(response.text)
                if len(cleaned) > 80:
                    logger.info("[Tier 2 - Direct HTTP] Successfully scraped %s (%d chars)", url, len(cleaned))
                    return cleaned
    except Exception as exc:
        logger.warning("[Tier 2 - Direct HTTP] In-house HTTP scrape failed for %s: %s", url, exc)

    return None


async def _scrape_jina_fallback(url: str) -> str:
    """
    TIER 3: Managed Cloud Fallback (Jina Reader).
    Engaged only if local in-house scrapers encounter strict anti-bot shields.
    """
    logger.info("[Tier 3 - Fallback] Engaging Jina Reader fallback for: %s", url)
    jina_url = f"{JINA_BASE}{url.strip()}"
    async with httpx.AsyncClient(timeout=40, follow_redirects=True) as client:
        response = await client.get(jina_url, headers=JINA_HEADERS)
        response.raise_for_status()
        content = response.text.strip()
        if not content:
            raise Exception(f"Jina Reader returned empty content for {url}")
        return content


async def scrape_website(url: str, bypass_cache: bool = False) -> str:
    """
    Orchestrates the 3-Tier Scraping Architecture:
      Tier 1: In-House Scrapling Stealth Engine (Primary)
      Tier 2: In-House Direct HTTP + Heading Sanitizer
      Tier 3: Managed Jina Reader Fallback (Emergency)

    Args:
        url: Full URL to scrape.
        bypass_cache: Kept for backward compatibility.

    Returns:
        Clean, structured text/Markdown.
    """
    url_clean = url.strip()

    # Step 1: Attempt In-House Scrapling
    content = await _scrape_with_scrapling(url_clean)
    if content:
        return content

    # Step 2: Attempt In-House Direct HTTP + Sanitizer
    content = await _scrape_direct_http(url_clean)
    if content:
        return content

    # Step 3: Managed Fallback
    try:
        return await _scrape_jina_fallback(url_clean)
    except Exception as e:
        logger.error("All 3 scraping tiers failed for %s: %s", url_clean, e)
        raise Exception(f"Failed to extract content for {url_clean} across all in-house and fallback engines.")


async def scrape_social(url: str) -> str:
    """Best-effort scrape of a social profile, trying direct engine before fallback."""
    logger.info("Scraping social/external profile: %s", url)
    try:
        content = await _scrape_direct_http(url)
        if content:
            return content[:8000]
        return await _scrape_jina_fallback(url)
    except Exception as e:
        logger.warning("Social scrape failed for %s: %s", url, e)
        return ""


async def crawl_and_scrape_competitor(base_url: str) -> Dict[str, Any]:
    """
    Full In-House Pipeline:
      1. InHouseCrawler discovers target URLs (Homepage, Pricing, Features, Changelog).
      2. In-House Scraper parallel-scrapes the discovered targets.
      3. Returns a unified intelligence dossier.
    """
    logger.info("=== Starting Autonomous In-House Crawl & Scrape for: %s ===", base_url)
    crawler = InHouseCrawler(base_url)
    target_pages = await crawler.crawl_navigation_graph()

    dossier: Dict[str, Any] = {
        "base_url": base_url,
        "discovered_endpoints": target_pages,
        "scraped_sections": {},
    }

    # Scrape priority pages concurrently
    async def _scrape_target(intent: str, page_url: str):
        try:
            text = await scrape_website(page_url)
            return intent, {"url": page_url, "content": text, "status": "SUCCESS"}
        except Exception as e:
            return intent, {"url": page_url, "content": "", "error": str(e), "status": "FAILED"}

    tasks = [_scrape_target(intent, page_url) for intent, page_url in target_pages.items()]
    results = await asyncio.gather(*tasks)

    for intent, data in results:
        dossier["scraped_sections"][intent] = data

    logger.info("=== In-House Crawl & Scrape Complete for %s (%d sections captured) ===", base_url, len(results))
    return dossier
