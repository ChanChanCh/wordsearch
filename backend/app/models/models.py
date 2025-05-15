from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # 관계 설정
    games = relationship("Game", back_populates="creator")
    participations = relationship("GameParticipant", back_populates="user")
    
    def __repr__(self):
        return f"User(id={self.id}, username={self.username})"


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    link_code = Column(String(10), unique=True, index=True, nullable=False)
    
    # 관계 설정
    creator = relationship("User", back_populates="games")
    words = relationship("GameWord", back_populates="game", cascade="all, delete-orphan")
    participants = relationship("GameParticipant", back_populates="game", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"Game(id={self.id}, title={self.title})"
    
    @classmethod
    def generate_link_code(cls):
        """고유한 링크 코드 생성"""
        return str(uuid.uuid4())[:8]


class GameWord(Base):
    __tablename__ = "game_words"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    word = Column(String(50), nullable=False)
    position_data = Column(JSON, nullable=False)  # JSON 형식으로 위치 데이터 저장
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 관계 설정
    game = relationship("Game", back_populates="words")
    
    def __repr__(self):
        return f"GameWord(id={self.id}, word={self.word})"


class GameParticipant(Base):
    __tablename__ = "game_participants"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # 로그인한 사용자는 user_id가 있음
    username = Column(String(50), nullable=False)  # 로그인하지 않은 사용자도 이름 필요
    score = Column(Integer, default=0)
    completion_time = Column(Float, nullable=True)  # 완료 시간(초)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 관계 설정
    game = relationship("Game", back_populates="participants")
    user = relationship("User", back_populates="participations", nullable=True)
    
    def __repr__(self):
        return f"GameParticipant(id={self.id}, username={self.username}, score={self.score})"