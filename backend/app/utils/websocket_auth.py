from fastapi import WebSocket, status
from jose import JWTError, jwt
from typing import Optional
from sqlalchemy.orm import Session
import os

from app.database import SessionLocal
from app.models.models import User
from app.utils.security import SECRET_KEY, ALGORITHM

async def get_user_from_token(token: str, db: Session) -> Optional[User]:
    """웹소켓 연결을 위한 토큰 검증 및 사용자 조회"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        
        user = db.query(User).filter(User.username == username).first()
        return user
    except JWTError:
        return None
    except Exception:
        return None

async def get_user_from_websocket(websocket: WebSocket) -> Optional[User]:
    """웹소켓 쿠키에서 토큰 추출 및 사용자 인증"""
    try:
        # 쿠키에서 토큰 가져오기 (클라이언트 구현에 따라 달라질 수 있음)
        cookies = websocket.cookies
        token = cookies.get("access_token")
        
        if not token:
            # 쿼리 파라미터에서 토큰 확인
            token = websocket.query_params.get("token")
            
        if not token:
            return None
        
        # DB 세션 생성
        db = SessionLocal()
        try:
            return await get_user_from_token(token, db)
        finally:
            db.close()
    except Exception:
        return None