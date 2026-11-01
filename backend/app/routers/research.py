from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user
from app.models.db import User
from app.adapters.tinysearch import TinySearchAdapter
from app.adapters.tinyfetch import TinyFetchAdapter
from app.schemas import SearchRequest, FetchRequest

router = APIRouter(prefix="/api/research", tags=["research"])


@router.post("/search")
async def search(
    req: SearchRequest,
    current_user: User = Depends(get_current_user),
):
    adapter = TinySearchAdapter()
    try:
        results = adapter.search(req.query, purpose=req.purpose, num_results=req.num_results)
        return {
            "results": [
                {
                    "id": f"s_{i}",
                    "url": r.url,
                    "domain": r.domain,
                    "title": r.title,
                    "snippet": r.snippet,
                    "source_type": r.source_type,
                    "discovered_at": r.discovered_at,
                }
                for i, r in enumerate(results)
            ]
        }
    except Exception as exc:
        raise HTTPException(500, f"Search failed: {exc}")


@router.post("/fetch")
async def fetch(
    req: FetchRequest,
    current_user: User = Depends(get_current_user),
):
    if len(req.urls) > 10:
        raise HTTPException(400, "Maximum 10 URLs per request")
    adapter = TinyFetchAdapter()
    try:
        results = adapter.fetch(req.urls, purpose=req.purpose)
        return {
            "results": [
                {
                    "url": r.url,
                    "domain": r.domain,
                    "title": r.title,
                    "text": r.text,
                    "success": r.success,
                    "error": r.error,
                    "fetched_at": r.fetched_at,
                }
                for r in results
            ]
        }
    except Exception as exc:
        raise HTTPException(500, f"Fetch failed: {exc}")
