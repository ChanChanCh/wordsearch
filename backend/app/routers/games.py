from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import secrets

from app.database import get_db
from app.models.models import Game, GameWord, User, GameParticipant
from app.schemas.game import GameCreate, GameResponse, GameBoardCreate, GameBoardResponse
from app.utils.security import get_current_active_user
from app.utils.word_search import generate_word_search

router = APIRouter(prefix="/games", tags=["games"])

@router.post("/", response_model=GameResponse)
def create_game(
    game_data: GameCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """새 Word Search 게임 생성"""
    # 단어 수 확인
    if len(game_data.words) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 5 words are required"
        )
    
    # 랜덤 링크 코드 생성
    link_code = secrets.token_urlsafe(6)
    
    # 게임 객체 생성
    db_game = Game(
        creator_id=current_user.id,
        title=game_data.title,
        description=game_data.description,
        link_code=link_code
    )
    
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    
    # Word Search 게임 보드 생성
    board, word_placements = generate_word_search(game_data.words)
    
    # 단어 및 위치 데이터 저장
    for word, placement in zip(game_data.words, word_placements):
        db_word = GameWord(
            game_id=db_game.id,
            word=word,
            position_data=json.dumps(placement)
        )
        db.add(db_word)
    
    db.commit()
    db.refresh(db_game)
    
    return db_game

@router.get("/", response_model=List[GameResponse])
def get_games(
    skip: int = 0, 
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_active_user)
):
    """현재 사용자가 생성한 게임 목록 조회"""
    games = db.query(Game)\
              .filter(Game.creator_id == current_user.id)\
              .order_by(Game.created_at.desc())\
              .offset(skip)\
              .limit(limit)\
              .all()
    return games

@router.get("/{game_id}", response_model=GameResponse)
def get_game(
    game_id: int,
    db: Session = Depends(get_db)
):
    """특정 게임 상세 정보 조회"""
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )
    return game

@router.get("/link/{link_code}", response_model=GameResponse)
def get_game_by_link(
    link_code: str,
    db: Session = Depends(get_db)
):
    """공유 링크 코드로 게임 조회"""
    game = db.query(Game).filter(Game.link_code == link_code).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found with this link code"
        )
    return game

@router.post("/board", response_model=GameBoardResponse)
def create_board(
    board_data: GameBoardCreate,
    db: Session = Depends(get_db)
):
    """게임 보드 생성 (단어 배치)"""
    board, word_placements = generate_word_search(
        board_data.words, 
        board_data.size
    )
    
    return {
        "board": board,
        "words": word_placements
    }

@router.delete("/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_game(
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """게임 삭제"""
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )
    
    if game.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this game"
        )
    
    db.delete(game)
    db.commit()
    return None