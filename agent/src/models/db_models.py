from pydantic import BaseModel
from typing import List, Optional


class ICPDataModel(BaseModel):
    keywords: Optional[List[str]] = None
    subreddits: Optional[List[str]] = None
    painPoints: Optional[str] = None
    description: Optional[str] = None


class ICPModel(BaseModel):
    id: int
    userId: str
    name: str
    data: Optional[ICPDataModel] = None
