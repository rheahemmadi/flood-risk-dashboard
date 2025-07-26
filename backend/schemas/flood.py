from pydantic import BaseModel, Field
from typing import Optional

class FloodPoint(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    latitude: float
    longitude: float
    riskLevel: str
    riverName: str
    segmentId: str

class FloodAlert(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    date: str
    riskLevel: str
    riverName: str
    segmentId: str 