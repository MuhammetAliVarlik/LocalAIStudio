import polars as pl
import yfinance as yf
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

app = FastAPI(title="Neural Finance Service (Polars)")

class StockQuote(BaseModel):
    symbol: str
    price: float
    change_percent: float
    volume: int
    market_cap: int = 0

@app.get("/market/summary")
def get_market_summary():
    """
    Fetches major indices using Polars for data handling.
    """
    indices = ["BTC-USD", "ETH-USD", "GC=F", "^GSPC"] # Bitcoin, Ethereum, Gold, S&P 500
    results = []

    try:
        # Fetch data in bulk (Efficient)
        tickers = yf.Tickers(" ".join(indices))
        
        for symbol in indices:
            ticker = tickers.tickers[symbol]
            # Fast history fetch
            hist = ticker.history(period="1d")
            
            if hist.empty:
                continue

            # 🚀 OPTIMIZATION: Convert Pandas to Polars immediately
            # Polars uses Arrow memory layout (Zero-Copy usually)
            df = pl.from_pandas(hist).tail(1)
            
            # Extract scalar values safely
            current_price = df["Close"][0]
            open_price = df["Open"][0]
            volume = df["Volume"][0]
            
            change = ((current_price - open_price) / open_price) * 100

            results.append({
                "symbol": symbol,
                "price": round(current_price, 2),
                "change": round(change, 2),
                "volume": int(volume)
            })
            
        return {"summary": results}
        
    except Exception as e:
        print(f"Finance Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/market/history/{symbol}")
def get_history(symbol: str, period: str = "1mo"):
    """
    Returns historical data optimized with Polars.
    """
    try:
        ticker = yf.Ticker(symbol)
        hist_pandas = ticker.history(period=period)
        
        if hist_pandas.empty:
            raise HTTPException(status_code=404, detail="Symbol not found")
            
        # 🚀 Polars conversion
        df = pl.from_pandas(hist_pandas.reset_index())
        
        # Select and rename columns efficiently
        # Polars syntax is cleaner and faster
        clean_df = df.select([
            pl.col("Date").cast(pl.String).alias("date"),
            pl.col("Close").round(2).alias("price")
        ])
        
        # Convert to dictionary (Rows)
        return {"history": clean_df.to_dicts()}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))