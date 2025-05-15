from pydantic import BaseModel, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
import re

class GameWordCreate(BaseModel):
    word: str
    
    @validator('word')
    def word_must_be_valid(cls, v):
        # 알파벳만 허용, 최대 15자
        if not re.match(r'^[A-Za-z]{1,15}$', v):
            raise ValueError('Word must contain only letters (A-Z, a-z) and be 1-15 characters long')
        return v.upper()  # 단어를 대문자로 저장

class GameCreate(BaseModel):
    title: str
    description: Optional[str] = None
    words: List[str]
    
    @validator('title')
    def title_must_be_valid(cls, v):
        if len(v) < 3 or len(v) > 100:
            raise ValueError('Title must be between 3 and 100 characters')
        return v
    
    @validator('words')
    def validate_words(cls, words):
        if len(words) < 5:
            raise ValueError('At least 5 words are required')
        if len(words) > 20:
            raise ValueError('Maximum 20 words allowed')
            
        # 단어 중복 제거 및 대문자 변환
        processed_words = [word.strip().upper() for word in words]
        processed_words = list(set(processed_words))  # 중복 제거
        
        # 단어 유효성 검사
        for word in processed_words:
            if not re.match(r'^[A-Z]{1,15}$', word):
                raise ValueError(f'Word "{word}" must contain only letters and be 1-15 characters long')
        
        return processed_words

class GameWordResponse(BaseModel):
    id: int
    word: str
    
    class Config:
        orm_mode = True

class GameResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    link_code: str
    created_at: datetime
    words: List[GameWordResponse]
    
    class Config:
        orm_mode = True

class GameBoardCreate(BaseModel):
    size: int = 15  # 기본 게임 보드 크기
    words: List[str]
    
class GameBoardResponse(BaseModel):
    board: List[List[str]]  # 2D 그리드 (문자 행렬)
    words: List[Dict[str, Any]]  # 단어와 위치 정보