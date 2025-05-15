from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Any
import httpx
import os
from dotenv import load_dotenv

from app.database import get_db
from app.models.models import User
from app.schemas.user import Token
from app.utils.security import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

# .env 파일 로드
load_dotenv()

# 환경 변수
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")

router = APIRouter(prefix="/auth/google", tags=["social_auth"])

@router.get("/login")
def login_google():
    """Google OAuth 로그인 URL 반환"""
    auth_url = "https://accounts.google.com/o/oauth2/auth"
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
    }
    
    # 쿼리 파라미터 생성
    query_params = "&".join([f"{k}={v}" for k, v in params.items()])
    return {"authorization_url": f"{auth_url}?{query_params}"}

@router.get("/callback", response_model=Token)
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """Google OAuth 콜백 처리"""
    # 인증 코드 가져오기
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Code not provided")
    
    # 토큰 요청
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": GOOGLE_REDIRECT_URI,
    }
    
    async with httpx.AsyncClient() as client:
        # 액세스 토큰 요청
        token_response = await client.post(token_url, data=token_data)
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get token")
        
        token_json = token_response.json()
        google_token = token_json.get("access_token")
        
        # 사용자 정보 요청
        user_info_url = "https://www.googleapis.com/oauth2/v1/userinfo"
        user_response = await client.get(
            user_info_url, 
            headers={"Authorization": f"Bearer {google_token}"}
        )
        
        if user_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        
        user_info = user_response.json()
        
        # 사용자 정보에서 이메일과 이름 추출
        email = user_info.get("email")
        name = user_info.get("name", "").replace(" ", "_").lower()
        
        if not email:
            raise HTTPException(status_code=400, detail="Email not found")
        
        # DB에서 사용자 조회 또는 생성
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            # 사용자가 없으면 새 사용자 생성
            # 랜덤 비밀번호 생성 (사용자는 소셜 로그인 사용)
            import secrets
            random_password = secrets.token_hex(16)
            
            # 이미 존재하는 username인 경우를 대비해 고유한 username 생성
            base_username = name or email.split("@")[0]
            username = base_username
            counter = 1
            
            while db.query(User).filter(User.username == username).first():
                username = f"{base_username}_{counter}"
                counter += 1
            
            from app.utils.security import get_password_hash
            user = User(
                username=username,
                email=email,
                password_hash=get_password_hash(random_password)
            )
            
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # JWT 토큰 생성
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        
        return {"access_token": access_token, "token_type": "bearer"}