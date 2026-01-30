from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from database import engine, Base, get_db
from models import Portfolio, Transaction
from market_data import market_service

# Initialize DB Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Neural Finance Service (Polars)", version="1.1.0")

# --- Pydantic Schemas ---
class AssetRequest(BaseModel):
    symbol: str
    asset_type: str = "stock"

class PortfolioItem(BaseModel):
    symbol: str
    quantity: float
    average_buy_price: float
    current_price: Optional[float] = None
    market_value: Optional[float] = None
    pnl: Optional[float] = None

# --- Endpoints ---

@app.get("/market/price/{symbol}")
async def get_asset_price(symbol: str, type: str = "stock"):
    """
    Get real-time price (Cached via Redis, Processed with Polars).
    """
    price = await market_service.get_price(symbol, type)
    if price is None:
        raise HTTPException(status_code=404, detail="Symbol not found")
    return {"symbol": symbol, "price": price, "currency": "USD"}

@app.post("/portfolio/add")
def add_to_portfolio(
    symbol: str, 
    quantity: float, 
    price: float, 
    asset_type: str = "stock",
    db: Session = Depends(get_db)
):
    """
    Add a transaction (Buy) to the portfolio.
    """
    # Check if exists
    item = db.query(Portfolio).filter(Portfolio.symbol == symbol.upper()).first()
    
    if not item:
        item = Portfolio(
            symbol=symbol.upper(),
            asset_type=asset_type,
            quantity=0,
            average_buy_price=0
        )
        db.add(item)
    
    # Calculate new weighted average price
    total_cost = (item.quantity * item.average_buy_price) + (quantity * price)
    new_quantity = item.quantity + quantity
    
    if new_quantity > 0:
        item.average_buy_price = total_cost / new_quantity
    item.quantity = new_quantity
    
    # Log Transaction
    txn = Transaction(
        portfolio_id=item.id,
        transaction_type="BUY",
        price=price,
        amount=quantity
    )
    db.add(txn)
    
    db.commit()
    db.refresh(item)
    return item

@app.get("/portfolio", response_model=List[PortfolioItem])
async def get_portfolio(db: Session = Depends(get_db)):
    """
    Returns the full portfolio with calculated PnL.
    """
    items = db.query(Portfolio).all()
    result = []
    
    for item in items:
        # Fetch live price
        current_price = await market_service.get_price(item.symbol, item.asset_type) or 0.0
        
        market_value = current_price * item.quantity
        cost_basis = item.average_buy_price * item.quantity
        pnl = market_value - cost_basis
        
        result.append({
            "symbol": item.symbol,
            "quantity": item.quantity,
            "average_buy_price": item.average_buy_price,
            "current_price": current_price,
            "market_value": round(market_value, 2),
            "pnl": round(pnl, 2)
        })
        
    return result

@app.get("/health")
def health_check():
    return {"status": "active", "service": "finance_service", "engine": "polars"}