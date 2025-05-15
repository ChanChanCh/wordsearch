from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# 환경 변수에서 데이터베이스 URL 가져오기 (기본값은 SQLite)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./wordsearch.db")

# 엔진 생성
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

# 세션 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base 클래스
Base = declarative_base()

# 의존성 주입을 위한 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()