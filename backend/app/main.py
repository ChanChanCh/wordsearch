from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.routers import auth, social_auth, games, ws
from app.database import engine, Base

# 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)

# FastAPI 앱 생성
app = FastAPI(title="Word Search Game API")

# CORS 설정
origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:3000",
    "*"  # 개발 환경에서만 허용하고, 프로덕션에서는 특정 도메인만 허용해야 함
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth.router)
app.include_router(social_auth.router)
# 다른 라우터들도 여기에 추가

# 정적 파일 서비스 설정 (프로덕션 환경)
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    return {"message": "Welcome to Word Search Game API"}