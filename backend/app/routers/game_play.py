from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
import json
from datetime import datetime

from app.database import get_db
from app.models.models import Game, GameWord, User, GameParticipant
from app.schemas.game import GameResponse
from app.utils.security import get_current_user

router = APIRouter(prefix="/play", tags=["game_play"])

@router.post("/{link_code}/join")
async def join_game(
    link_code: str,
    username: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """게임 참여 (로그인/비로그인 모두 가능)"""
    # 게임 확인
    game = db.query(Game).filter(Game.link_code == link_code).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )
    
    # 참여자 생성
    participant = GameParticipant(
        game_id=game.id,
        user_id=current_user.id if current_user else None,
        username=username,
        score=0,
        completion_time=None
    )
    
    db.add(participant)
    db.commit()
    db.refresh(participant)
    
    return {
        "participant_id": participant.id,
        "game_id": game.id,
        "username": username
    }

@router.get("/{link_code}")
async def get_game_data(
    link_code: str,
    db: Session = Depends(get_db)
):
    """게임 데이터 조회"""
    # 게임 확인
    game = db.query(Game).filter(Game.link_code == link_code).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )
    
    # 단어 정보 가져오기
    words = db.query(GameWord).filter(GameWord.game_id == game.id).all()
    
    # 게임 보드 생성
    board = []
    word_placements = []
    
    for word in words:
        placement = json.loads(word.position_data)
        word_placements.append({
            "word": word.word,
            "positions": placement["positions"],
            "direction": placement["direction"]
        })
        
        # 첫 번째 단어의 위치 정보를 사용하여 보드 크기 결정
        if not board:
            # 최대 행과 열 찾기
            max_row = max([pos["row"] for pos in placement["positions"]])
            max_col = max([pos["col"] for pos in placement["positions"]])
            
            # 보드 크기는 최소 15x15, 또는 단어 위치에 맞게 조정
            size = max(15, max(max_row, max_col) + 1)
            
            # 빈 보드 생성
            board = [['' for _ in range(size)] for _ in range(size)]
        
        # 단어 위치 적용
        for pos in placement["positions"]:
            row, col = pos["row"], pos["col"]
            letter_index = placement["positions"].index(pos)
            board[row][col] = word.word[letter_index]
    
    # 빈 칸 채우기 (이미 채워진 경우 유지)
    import random
    import string
    for i in range(len(board)):
        for j in range(len(board[i])):
            if not board[i][j]:
                board[i][j] = random.choice(string.ascii_uppercase)
    
    return {
        "game": {
            "id": game.id,
            "title": game.title,
            "description": game.description,
            "created_at": game.created_at
        },
        "board": board,
        "words": [wp["word"] for wp in word_placements]
    }

@router.post("/{link_code}/verify-word")
async def verify_word(
    link_code: str,
    participant_id: int,
    word: str,
    selected_positions: List[Dict[str, int]],
    db: Session = Depends(get_db)
):
    """선택한 단어 검증"""
    # 게임 확인
    game = db.query(Game).filter(Game.link_code == link_code).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )
    
    # 참여자 확인
    participant = db.query(GameParticipant).filter(
        GameParticipant.id == participant_id,
        GameParticipant.game_id == game.id
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found"
        )
    
    # 게임 단어 확인
    game_words = db.query(GameWord).filter(GameWord.game_id == game.id).all()
    
    # 선택한 단어 대문자로 변환
    word = word.strip().upper()
    
    # 단어 검증
    correct = False
    
    for game_word in game_words:
        if game_word.word == word:
            # 단어의 위치 정보
            position_data = json.loads(game_word.position_data)
            word_positions = position_data["positions"]
            
            # 선택한 위치가 올바른지 확인
            if len(selected_positions) == len(word_positions):
                # 모든 위치가 일치하는지 확인
                all_match = all(
                    any(
                        sp["row"] == wp["row"] and sp["col"] == wp["col"]
                        for wp in word_positions
                    )
                    for sp in selected_positions
                )
                
                if all_match:
                    correct = True
                    
                    # 점수 업데이트 (단어 길이에 따라 점수 부여)
                    participant.score += len(word) * 10
                    db.commit()
                    break
    
    return {
        "word": word,
        "correct": correct,
        "score": participant.score if correct else None
    }

@router.post("/{link_code}/complete")
async def complete_game(
    link_code: str,
    participant_id: int,
    completion_time: float,
    db: Session = Depends(get_db)
):
    """게임 완료 및 결과 저장"""
    # 게임 확인
    game = db.query(Game).filter(Game.link_code == link_code).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )
    
    # 참여자 확인
    participant = db.query(GameParticipant).filter(
        GameParticipant.id == participant_id,
        GameParticipant.game_id == game.id
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found"
        )
    
    # 완료 시간 기록
    participant.completion_time = completion_time
    db.commit()
    db.refresh(participant)
    
    return {
        "participant_id": participant.id,
        "username": participant.username,
        "score": participant.score,
        "completion_time": participant.completion_time
    }

@router.get("/{link_code}/leaderboard")
async def get_leaderboard(
    link_code: str,
    db: Session = Depends(get_db)
):
    """게임 현황판 조회"""
    # 게임 확인
    game = db.query(Game).filter(Game.link_code == link_code).first()
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )
    
    # 참여자 목록 조회 (점수 내림차순, 완료 시간 오름차순)
    participants = db.query(GameParticipant).filter(
        GameParticipant.game_id == game.id
    ).order_by(
        GameParticipant.score.desc(),
        GameParticipant.completion_time.asc()
    ).all()
    
    return [
        {
            "participant_id": p.id,
            "username": p.username,
            "score": p.score,
            "completion_time": p.completion_time
        }
        for p in participants
    ]