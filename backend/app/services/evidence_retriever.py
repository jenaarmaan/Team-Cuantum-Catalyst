"""
NYASA Evidence Retrieval Service
Uses Tavily Search API to retrieve web evidence for claim verification.

Generates multiple search queries from the extracted claim,
retrieves results, deduplicates, and normalizes into EvidenceItems.
"""

import uuid
from datetime import datetime, timezone
from typing import List
from tavily import TavilyClient
from app.core.config import settings
from app.models.schemas import EvidenceItem, SourceType, EvidenceStance


def _classify_source_type(url: str, source_name: str) -> SourceType:
    """Classify source type based on URL and name. This is heuristic, not authoritative."""
    url_lower = url.lower()
    name_lower = source_name.lower()

    # Government
    gov_indicators = [".gov", ".nic.in", ".gov.in", "government", "official"]
    if any(ind in url_lower or ind in name_lower for ind in gov_indicators):
        return SourceType.GOVERNMENT

    # Fact checkers
    fact_check = ["factcheck", "snopes", "politifact", "altnews", "boomlive", "vishvasnews",
                  "factly", "thequint.com/news/webqoof", "reuters.com/fact-check"]
    if any(fc in url_lower or fc in name_lower for fc in fact_check):
        return SourceType.FACT_CHECKER

    # Major news
    major_news = ["reuters", "ap news", "apnews", "bbc", "cnn", "nytimes", "guardian",
                  "washingtonpost", "aljazeera", "ndtv", "thehindu", "indianexpress",
                  "hindustantimes", "timesofindia", "news18", "scroll.in", "thewire"]
    if any(mn in url_lower or mn in name_lower for mn in major_news):
        return SourceType.NEWS_MAJOR

    # Academic
    academic = [".edu", ".ac.", "arxiv", "scholar", "pubmed", "doi.org", "researchgate"]
    if any(ac in url_lower for ac in academic):
        return SourceType.ACADEMIC

    # Social media
    social = ["twitter.com", "x.com", "facebook.com", "instagram.com", "reddit.com",
              "youtube.com", "tiktok.com", "threads.net"]
    if any(sm in url_lower for sm in social):
        return SourceType.SOCIAL_MEDIA

    # Blog/forum
    blog_indicators = ["blog", "medium.com", "wordpress", "substack", "quora"]
    if any(b in url_lower for b in blog_indicators):
        return SourceType.BLOG

    # Default to local news as a reasonable middle ground
    news_indicators = ["news", "times", "herald", "post", "tribune", "gazette", "journal"]
    if any(n in url_lower or n in name_lower for n in news_indicators):
        return SourceType.NEWS_LOCAL

    return SourceType.UNKNOWN


def _generate_search_queries(claim_text: str, location: str = None,
                              event_type: str = None, entities: List[str] = None) -> List[str]:
    """Generate multiple search queries from a structured claim for better evidence coverage."""
    queries = []

    # Primary: the claim itself
    queries.append(claim_text)

    # With location focus
    if location:
        queries.append(f"{claim_text} {location}")

    # Event-specific
    if event_type and location:
        queries.append(f"{event_type} {location} latest news")

    # Fact-check specific
    queries.append(f"fact check {claim_text}")

    # Entity-focused
    if entities:
        entity_str = " ".join(entities[:3])
        queries.append(f"{entity_str} {event_type or 'news'} verification")

    return queries[:4]  # Cap at 4 queries to manage API usage


async def retrieve_evidence(
    claim_text: str,
    location: str = None,
    event_type: str = None,
    entities: List[str] = None,
) -> List[EvidenceItem]:
    """
    Retrieve web evidence for a claim using Tavily Search.
    Returns normalized EvidenceItems with source metadata and retrieval timestamps.
    """
    import os
    tavily_key = settings.tavily_api_key or os.getenv("TAVILY_API_KEY")
    if not tavily_key or tavily_key.strip() == "":
        print("[NYASA] Tavily Search skipped: API credentials are not configured.")
        return []

    # Local fallback parsing if no location/entities are passed to generate high-quality search queries
    if not location or not event_type or not entities:
        import re
        if not location:
            loc_match = re.search(r'\b(?:in|at|near|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)', claim_text)
            if loc_match:
                location = loc_match.group(1)
        
        if not event_type:
            event_keywords = ["flood", "earthquake", "protest", "strike", "blast", "explosion", "accident", "fire", "election", "meeting", "clash", "war"]
            for kw in event_keywords:
                if kw in claim_text.lower():
                    event_type = kw
                    break
        
        if not entities:
            caps = re.findall(r'\b[A-Z][a-z]+\b', claim_text)
            if caps:
                entities = list(set(caps))

    try:
        client = TavilyClient(api_key=tavily_key)

        queries = _generate_search_queries(claim_text, location, event_type, entities)
        retrieval_time = datetime.now(timezone.utc).isoformat()

        all_results = []
        seen_urls = set()

        for query in queries:
            try:
                response = client.search(
                    query=query,
                    search_depth="advanced",
                    max_results=5,
                    include_answer=False,
                )

                for result in response.get("results", []):
                    url = result.get("url", "")

                    # Deduplicate by URL
                    if url in seen_urls:
                        continue
                    seen_urls.add(url)

                    source_name = result.get("title", "Unknown Source").split(" - ")[-1].strip() \
                        if " - " in result.get("title", "") else _extract_domain(url)

                    evidence = EvidenceItem(
                        evidence_id=f"ev_{uuid.uuid4().hex[:8]}",
                        title=result.get("title", "Untitled"),
                        snippet=result.get("content", "")[:500],
                        source_name=source_name,
                        source_type=_classify_source_type(url, source_name),
                        source_url=url,
                        published_date=result.get("published_date"),
                        retrieved_at=retrieval_time,
                        stance=EvidenceStance.UNRESOLVED,  # Classified later by evidence_ranker
                        relevance_score=result.get("score", 0.5),
                        authority_score=0.5,  # Scored later by evidence_ranker
                        stance_reasoning="",
                    )
                    all_results.append(evidence)

            except Exception as e:
                print(f"[NYASA] Search query failed: {query} — {e}")
                continue

        return all_results

    except Exception as e:
        print(f"[NYASA] Evidence retrieval error: {e}")
        return []


def _extract_domain(url: str) -> str:
    """Extract domain name from URL for source identification."""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        domain = parsed.netloc.replace("www.", "")
        return domain
    except Exception:
        return "Unknown"
