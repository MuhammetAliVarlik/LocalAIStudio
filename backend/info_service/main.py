from fastapi import FastAPI, HTTPException
from duckduckgo_search import DDGS
import requests

app = FastAPI(title="Neural Info Service")

@app.get("/weather")
def get_weather(city: str = "Ankara"):
    """
    Fetches weather via wttr.in (No API Key needed, very lightweight).
    """
    try:
        # format=j1 returns JSON
        url = f"https://wttr.in/{city}?format=j1"
        resp = requests.get(url, timeout=5)
        data = resp.json()
        
        current = data['current_condition'][0]
        return {
            "city": city,
            "temp_C": current['temp_C'],
            "desc": current['weatherDesc'][0]['value'],
            "humidity": current['humidity'],
            "wind": current['windspeedKmph']
        }
    except Exception as e:
        # Fallback if wttr.in is down
        return {"error": "Weather service unavailable", "detail": str(e)}

@app.get("/news")
def get_news(query: str = "technology"):
    """
    Fetches news using DuckDuckGo (Privacy focused, no API key).
    """
    try:
        with DDGS() as ddgs:
            # Get top 5 news results
            results = list(ddgs.news(keywords=query, max_results=5))
            return {"news": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search")
def web_search(query: str):
    """
    General web search for RAG context.
    """
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(keywords=query, max_results=3))
            return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))