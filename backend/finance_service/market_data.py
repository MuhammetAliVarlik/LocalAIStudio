import logging
import yfinance as yf
import redis.asyncio as redis
import polars as pl
from config import settings

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MarketData")

class MarketDataService:
    """
    Service to fetch market data using Polars for data manipulation
    and Redis for caching.
    """
    
    def __init__(self):
        self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)

    async def get_price(self, symbol: str, asset_type: str = "stock"):
        """
        Fetches the current price of an asset.
        Strategy: Check Redis -> If Miss, Fetch API -> Update Redis.
        """
        cache_key = f"price:{symbol.upper()}"
        
        # 1. Check Cache
        cached_price = await self.redis.get(cache_key)
        if cached_price:
            logger.info(f"⚡ Cache Hit: {symbol} = {cached_price}")
            return float(cached_price)
        
        # 2. Fetch from External API
        logger.info(f"🌍 Fetching live data for: {symbol}")
        price = self._fetch_live_price(symbol, asset_type)
        
        if price:
            # 3. Cache the result
            await self.redis.setex(cache_key, settings.CACHE_EXPIRY_SECONDS, price)
        
        return price

    def _fetch_live_price(self, symbol: str, asset_type: str) -> float:
        """
        Internal method to fetch from yfinance and process with Polars.
        """
        try:
            # Adjust symbol for Yahoo Finance (e.g., BTC -> BTC-USD)
            query_symbol = symbol
            if asset_type == "crypto" and "-" not in symbol:
                query_symbol = f"{symbol}-USD"
            
            ticker = yf.Ticker(query_symbol)
            
            # Try fast_info first (Scalar access, fastest)
            if hasattr(ticker, 'fast_info') and ticker.fast_info.last_price:
                return round(ticker.fast_info.last_price, 4)
            
            # Fallback to history (Returns Pandas DF -> Convert to Polars)
            # We convert to Polars immediately for performance if we were doing heavy calcs.
            # Here we just need the last close, but demonstrating the Polars pattern:
            pdf = ticker.history(period="1d")
            
            if pdf.empty:
                return None
            
            # Convert Pandas DataFrame to Polars DataFrame
            df = pl.from_pandas(pdf)
            
            # Efficiently select the last 'Close' value
            # Polars is column-oriented, selecting "Close" is extremely cheap.
            price = df.select(pl.col("Close")).tail(1).item()
                
            return round(price, 4)
            
        except Exception as e:
            logger.error(f"❌ Market Data Error ({symbol}): {e}")
            return None

    async def get_market_summary(self, symbols: list):
        """
        Batch fetch prices.
        """
        results = {}
        for sym in symbols:
            atype = "crypto" if sym in ["BTC", "ETH", "SOL"] else "stock"
            price = await self.get_price(sym, atype)
            results[sym] = price
        return results

# Singleton Instance
market_service = MarketDataService()