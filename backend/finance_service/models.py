from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Portfolio(Base):
    """
    Represents a user's holding of a specific asset.
    """
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True)  # e.g., "BTC", "AAPL"
    asset_type = Column(String)          # crypto, stock
    quantity = Column(Float, default=0.0)
    average_buy_price = Column(Float, default=0.0)
    
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Transaction(Base):
    """
    Records history of buys and sells.
    """
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"))
    transaction_type = Column(String) # BUY / SELL
    price = Column(Float)
    amount = Column(Float)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())