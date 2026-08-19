"""Legal research via IndianKanoon API + Claude AI summarization."""

import hashlib
import json
import logging

import httpx
import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.claude_service import generate_legal_document

router = APIRouter(prefix="/research", tags=["research"])
logger = logging.getLogger(__name__)

IK_BASE = "https://api.indiankanoon.org"
CACHE_TTL = 86400  # 24 hours


class ResearchQuery(BaseModel):
    query: str
    summarize: bool = True


class JudgmentResult(BaseModel):
    title: str
    court: str
    date: str
    citation: str | None
    headline: str
    url: str
    doc_id: str
    ai_summary: str | None = None


class ResearchResponse(BaseModel):
    query: str
    results: list[JudgmentResult]
    total_found: int
    from_cache: bool = False


def _cache_key(query: str) -> str:
    h = hashlib.md5(query.lower().strip().encode()).hexdigest()
    return f"research:{h}"


async def _search_indiankanoon(query: str) -> list[dict]:
    """Hit IndianKanoon search API. Falls back to demo results if no API key."""
    headers = {"Authorization": f"Token {settings.INDIANKANOON_API_KEY}"} if settings.INDIANKANOON_API_KEY else {}

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            f"{IK_BASE}/search/",
            data={"formInput": query, "pagenum": 0},
            headers=headers,
        )
        if resp.status_code == 401:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="IndianKanoon API key not configured. Add INDIANKANOON_API_KEY to .env (register free at indiankanoon.org/api).",
            )
        resp.raise_for_status()
        data = resp.json()

    docs = data.get("docs", [])
    results = []
    for doc in docs[:8]:
        results.append({
            "title": doc.get("title", "Untitled"),
            "court": doc.get("docsource", ""),
            "date": doc.get("publishdate", ""),
            "citation": doc.get("citation", None),
            "headline": doc.get("headline", ""),
            "doc_id": str(doc.get("tid", "")),
            "url": f"https://indiankanoon.org/doc/{doc.get('tid', '')}/",
        })
    return results


async def _ai_summarize(query: str, results: list[dict]) -> list[dict]:
    """Use Claude to add AI summaries to top 5 results."""
    if not results:
        return results

    top = results[:5]
    cases_text = "\n\n".join(
        f"Case {i+1}: {r['title']} ({r['court']}, {r['date']})\n{r['headline']}"
        for i, r in enumerate(top)
    )

    prompt = f"""You are an expert Indian legal researcher. The lawyer searched for: "{query}"

Here are the top search results from IndianKanoon:

{cases_text}

For each case, provide a 2-sentence summary covering:
1. The core legal issue decided
2. The key holding / ratio decidendi

Format as JSON array with keys: doc_id (use the case number 1-5), summary

Respond ONLY with valid JSON."""

    try:
        raw = await generate_legal_document(
            system_prompt="You are an expert Indian legal researcher. Respond only with valid JSON.",
            form_data={"query": query, "cases": cases_text},
            language="en",
            doc_type="research_summary",
        )
        # Extract JSON from response
        start = raw.find("[")
        end = raw.rfind("]") + 1
        if start >= 0 and end > start:
            summaries = json.loads(raw[start:end])
            summary_map = {str(s.get("doc_id", i + 1)): s.get("summary", "") for i, s in enumerate(summaries)}
            for i, r in enumerate(top):
                r["ai_summary"] = summary_map.get(str(i + 1), "")
    except Exception as e:
        logger.warning("AI summarization failed: %s", e)

    return results


@router.post("/search", response_model=ResearchResponse)
async def search_judgments(
    body: ResearchQuery,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResearchResponse:
    if len(body.query.strip()) < 5:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Query too short")

    redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    cache_key = _cache_key(body.query + ("_ai" if body.summarize else ""))
    from_cache = False

    try:
        cached = await redis.get(cache_key)
        if cached:
            data = json.loads(cached)
            return ResearchResponse(**data, from_cache=True)

        results = await _search_indiankanoon(body.query)

        if body.summarize and results:
            results = await _ai_summarize(body.query, results)

        response_data = {
            "query": body.query,
            "results": [
                JudgmentResult(
                    title=r["title"],
                    court=r["court"],
                    date=r["date"],
                    citation=r.get("citation"),
                    headline=r["headline"],
                    url=r["url"],
                    doc_id=r["doc_id"],
                    ai_summary=r.get("ai_summary"),
                )
                for r in results
            ],
            "total_found": len(results),
        }

        await redis.setex(cache_key, CACHE_TTL, json.dumps({
            "query": response_data["query"],
            "results": [r.model_dump() for r in response_data["results"]],
            "total_found": response_data["total_found"],
        }))

        return ResearchResponse(**response_data)
    finally:
        await redis.aclose()


@router.get("/popular")
async def popular_queries(current_user: User = Depends(get_current_user)) -> list[dict]:
    """Pre-seeded popular search queries for quick access."""
    return [
        {"label": "Section 138 NI Act — Cheque Bounce", "query": "section 138 negotiable instruments act cheque dishonour"},
        {"label": "Bail — Non-bailable offence principles", "query": "bail non-bailable offence principles supreme court"},
        {"label": "Consumer protection deficiency of service", "query": "consumer protection act deficiency of service compensation"},
        {"label": "Rent Control eviction grounds", "query": "rent control act eviction grounds tenant landlord"},
        {"label": "Motor accident compensation quantum", "query": "motor accident compensation quantum permanent disability"},
        {"label": "Domestic violence protection order", "query": "domestic violence act protection order interim relief"},
        {"label": "GST demand notice reply", "query": "GST demand notice SCN reply high court quash"},
        {"label": "Anticipatory bail BNSS", "query": "anticipatory bail BNSS section 482 conditions principles"},
        {"label": "Specific performance contract", "query": "specific performance contract land sale agreement"},
        {"label": "Writ habeas corpus illegal detention", "query": "habeas corpus writ illegal detention fundamental rights"},
    ]
