# schemas.py
from pydantic import BaseModel

class StationCreate(BaseModel):
    name: str

class ReviewCreate(BaseModel):
    text: str

class Review(BaseModel):
    id: int
    station_id: int
    text: str
    cleanliness_sentiment: str | None = None
    crowdness_sentiment: str | None = None
    facilities_sentiment: str | None = None
    overall_sentiment: str | None = None
    price_sentiment: str | None = None

    class Config:
        orm_mode = True

class Station(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True
