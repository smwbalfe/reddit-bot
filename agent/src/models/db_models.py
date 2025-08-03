from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ICPDataModel(BaseModel):
    keywords: Optional[List[str]] = None
    subreddits: Optional[List[str]] = None
    painPoints: Optional[str] = None
    description: Optional[str] = None

class ICPModel(BaseModel):
    id: int
    name: str
    website: str
    data: Optional[ICPDataModel] = None