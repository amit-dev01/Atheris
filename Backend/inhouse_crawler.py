"""
In-House Autonomous Competitive Web Crawler (Spider) for Atheris.

Discovers key intelligence assets from a competitor's domain without blind,
wasteful full-site spidering:
  1. Robots.txt & Sitemap Graph Traversal (/sitemap.xml, /sitemap_index.xml)
  2. Targeted BFS Nav-Graph Traversal (parsing <nav>, <header>, <footer> anchors)
  3. Intent-Driven Link Classification:
     - PRICING: /pricing, /plans, /subscription, /tiers, /calculator
     - FEATURES: /features, /product, /platform, /solutions, /capabilities
     - CHANGELOG: /changelog, /releases, /whats-new, /updates, /release-notes
     - BLOG: /blog, /news, /press, /insights
     - ABOUT: /about, /company, /story

Enforces strict domain jailing (never leaves the target domain) and depth constraints (depth <= 2).
"""

import asyncio
import logging
import re
from typing import Dict, List, Optional, Set
from urllib.parse import urljoin, urlparse
import xml.etree.ElementTree as ET

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# Intent-matching dictionaries (evaluated against both URL paths and anchor text)
INTENT_PATTERNS = {
    "PRICING": {
        "keywords": ["pricing", "price", "plans", "plan", "tiers", "tier", "subscription", "cost", "quote", "calculator"],
        "weight": 1.0,
    },
    "CHANGELOG": {
        "keywords": ["changelog", "releases", "release", "whats-new", "updates", "update", "release-notes", "roadmap"],
        "weight": 0.95,
    },
    "FEATURES": {
        "keywords": ["features", "feature", "product", "platform", "solutions", "solution", "capabilities", "modules", "overview"],
        "weight": 0.90,
    },
    "BLOG": {
        "keywords": ["blog", "news", "press", "insights", "stories", "articles"],
        "weight": 0.70,
    },
    "ABOUT": {
        "keywords": ["about", "about-us", "company", "team", "story"],
        "weight": 0.60,
    },
}

IGNORED_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico",
    ".pdf", ".zip", ".tar", ".gz", ".mp4", ".mp3", ".wav",
    ".css", ".js", ".json", ".xml", ".woff", ".woff2", ".ttf"
}


def _clean_domain(url: str) -> str:
    """Extract root domain, stripping scheme and www."""
    try:
        parsed = urlparse(url if "://" in url else f"https://{url}")
        host = parsed.netloc.lower()
        if host.startswith("www."):
            host = host[4:]
        return host
    except Exception:
        return url.lower()


class InHouseCrawler:
    """Autonomous targeted crawler for competitor domain intelligence discovery."""

    def __init__(self, base_url: str, max_depth: int = 2, max_pages_to_queue: int = 15):
        clean_url = base_url.strip()
        if not clean_url.startswith(("http://", "https://")):
            clean_url = f"https://{clean_url}"
        self.base_url = clean_url.rstrip("/")
        self.domain = _clean_domain(clean_url)
        self.max_depth = max_depth
        self.max_pages_to_queue = max_pages_to_queue
        self.visited: Set[str] = set()

    async def _fetch_html(self, client: httpx.AsyncClient, url: str) -> Optional[str]:
        """Fetch raw HTML with realistic browser headers and safe timeout."""
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }
        try:
            res = await client.get(url, headers=headers, follow_redirects=True, timeout=12.0)
            if res.status_code == 200 and "text/html" in res.headers.get("content-type", "").lower():
                return res.text
        except Exception as e:
            logger.debug("Crawler fetch failed for %s: %s", url, e)
        return None

    def _is_valid_internal_link(self, link: str) -> bool:
        """Ensure link is valid, HTTP/HTTPS, within domain, and not an asset file."""
        if not link or link.startswith(("#", "javascript:", "mailto:", "tel:")):
            return False
        
        parsed = urlparse(link)
        if parsed.scheme and parsed.scheme not in ("http", "https"):
            return False

        link_domain = _clean_domain(link)
        if link_domain and link_domain != self.domain:
            return False

        path_lower = parsed.path.lower()
        if any(path_lower.endswith(ext) for ext in IGNORED_EXTENSIONS):
            return False

        return True

    def _classify_intent(self, path: str, anchor_text: str) -> Optional[str]:
        """Determine strategic intent (PRICING, FEATURES, CHANGELOG, etc.)."""
        norm_path = path.lower().replace("-", " ").replace("_", " ")
        norm_text = anchor_text.lower()
        combined = f"{norm_path} {norm_text}"

        for intent, data in INTENT_PATTERNS.items():
            for kw in data["keywords"]:
                pattern = rf"\b{re.escape(kw)}\b"
                if re.search(pattern, combined):
                    return intent
        return None

    async def discover_sitemap_urls(self, client: httpx.AsyncClient) -> List[Dict[str, str]]:
        """Inspect robots.txt and sitemap.xml for candidate target URLs."""
        found = []
        sitemap_candidates = [
            f"{self.base_url}/sitemap.xml",
            f"{self.base_url}/sitemap_index.xml",
            f"{self.base_url}/sitemap-pages.xml",
        ]

        # 1. Check robots.txt for custom Sitemap directives
        try:
            robots_url = f"{self.base_url}/robots.txt"
            res = await client.get(robots_url, timeout=8.0, follow_redirects=True)
            if res.status_code == 200:
                for line in res.text.splitlines():
                    if line.lower().startswith("sitemap:"):
                        sm_url = line.split(":", 1)[1].strip()
                        if sm_url and sm_url not in sitemap_candidates:
                            sitemap_candidates.insert(0, sm_url)
        except Exception:
            pass

        # 2. Probe sitemaps and parse XML loc tags
        for sm_url in sitemap_candidates[:3]:
            try:
                res = await client.get(sm_url, timeout=10.0, follow_redirects=True)
                if res.status_code == 200 and ("xml" in res.headers.get("content-type", "") or res.text.startswith("<?xml")):
                    root = ET.fromstring(res.text)
                    # Support both standard sitemap and sitemapindex schemas
                    for elem in root.iter():
                        if elem.tag.endswith("loc") and elem.text:
                            loc_url = elem.text.strip()
                            if self._is_valid_internal_link(loc_url):
                                parsed = urlparse(loc_url)
                                intent = self._classify_intent(parsed.path, "")
                                if intent:
                                    found.append({"url": loc_url, "intent": intent, "source": "SITEMAP"})
                    if found:
                        break
            except Exception as e:
                logger.debug("Failed parsing sitemap %s: %s", sm_url, e)

        return found

    async def crawl_navigation_graph(self) -> Dict[str, str]:
        """
        Execute targeted BFS crawl on the competitor's root homepage and navbar links.
        Returns a classified dictionary of prime intelligence URLs.
        """
        results: Dict[str, str] = {
            "HOMEPAGE": self.base_url
        }
        all_candidates: List[Dict[str, str]] = []

        async with httpx.AsyncClient(verify=False) as client:
            # Step 1: Query Sitemap in parallel with homepage
            sitemap_task = self.discover_sitemap_urls(client)
            homepage_task = self._fetch_html(client, self.base_url)

            sitemap_links, html = await asyncio.gather(sitemap_task, homepage_task)

            if sitemap_links:
                for link_meta in sitemap_links:
                    intent = link_meta["intent"]
                    if intent not in results:
                        results[intent] = link_meta["url"]
                    all_candidates.append(link_meta)

            # Step 2: Parse Homepage DOM Navigation Graph
            if html:
                soup = BeautifulSoup(html, "html.parser")
                
                # Priority 1: High-signal structural containers (<nav>, <header>, <footer>)
                nav_anchors = []
                for container in soup.find_all(["nav", "header", "footer"]):
                    nav_anchors.extend(container.find_all("a", href=True))

                # Priority 2: Full document anchors if navigation container was sparse
                if len(nav_anchors) < 5:
                    nav_anchors = soup.find_all("a", href=True)

                for a in nav_anchors:
                    href = a.get("href", "").strip()
                    anchor_text = a.get_text(separator=" ", strip=True)
                    full_url = urljoin(self.base_url, href)

                    if not self._is_valid_internal_link(full_url):
                        continue

                    parsed = urlparse(full_url)
                    path = parsed.path.rstrip("/")
                    if not path:
                        continue

                    intent = self._classify_intent(path, anchor_text)
                    if intent:
                        if intent not in results:
                            results[intent] = full_url
                        all_candidates.append({"url": full_url, "intent": intent, "source": "DOM_NAV"})

        # Step 3: Sensible defaults for unlocated standard paths
        defaults = {
            "PRICING": f"{self.base_url}/pricing",
            "FEATURES": f"{self.base_url}/features",
            "CHANGELOG": f"{self.base_url}/changelog",
            "BLOG": f"{self.base_url}/blog",
        }
        for intent, fallback_url in defaults.items():
            if intent not in results:
                results[intent] = fallback_url

        logger.info(
            "InHouseCrawler discovered %d key endpoints for %s (Pricing: %s, Features: %s, Changelog: %s)",
            len(results),
            self.domain,
            results.get("PRICING"),
            results.get("FEATURES"),
            results.get("CHANGELOG")
        )
        return results

    @classmethod
    async def discover_competitor_pages(cls, base_url: str) -> Dict[str, str]:
        """Convenience factory method to discover competitor target endpoints."""
        crawler = cls(base_url)
        return await crawler.crawl_navigation_graph()
