from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from typing import Dict, List, Any, Optional
import json
import asyncio

from app.database import get_db, SessionLocal
from app.models.models import Game, GameParticipant
from app.utils.websocket_auth import get_user_from_websocket

router = APIRouter(tags=["websocket"])

# 게임별 활성 연결 관리
active_connections: Dict[str, List[WebSocket]] = {}

@router.websocket("/ws/game/{link_code}")
async def websocket_game_endpoint(websocket: WebSocket, link_code: str):
    """게임 실시간 업데이트를 위한 WebSocket 엔드포인트"""
    await websocket.accept()
    
    # 연결 관리
    if link_code not in active_connections:
        active_connections[link_code] = []
    active_connections[link_code].append(websocket)
    
    try:
        # 초기 현황판 데이터 전송
        leaderboard = await get_leaderboard_data(link_code)
        await websocket.send_json({
            "type": "leaderboard",
            "data": leaderboard
        })
        
        # 클라이언트로부터 메시지 대기
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # 메시지 유형에 따른 처리
            if message["type"] == "update":
                # 현황판 업데이트 및 모든 연결에 브로드캐스트
                await broadcast_leaderboard(link_code)
            elif message["type"] == "join":
                # 새 참여자 정보 브로드캐스트
                await broadcast_to_game(link_code, {
                    "type": "player_joined",
                    "data": {
                        "username": message["username"],
                        "participant_id": message["participant_id"]
                    }
                })
            elif message["type"] == "found_word":
                # 단어 찾음 이벤트 브로드캐스트
                await broadcast_to_game(link_code, {
                    "type": "word_found",
                    "data": {
                        "username": message["username"],
                        "word": message["word"],
                        "score": message["score"]
                    }
                })
    except WebSocketDisconnect:
        # 연결 종료 처리
        active_connections[link_code].remove(websocket)
        if not active_connections[link_code]:
            del active_connections[link_code]
    except Exception as e:
        print(f"WebSocket error: {e}")
        # 연결 종료 처리
        if link_code in active_connections and websocket in active_connections[link_code]:
            active_connections[link_code].remove(websocket)
            if not active_connections[link_code]:
                del active_connections[link_code]

async def broadcast_to_game(link_code: str, message: Dict[str, Any]):
    """특정 게임의 모든 연결에 메시지 브로드캐스트"""
    if link_code in active_connections:
        for connection in active_connections[link_code]:
            try:
                await connection.send_json(message)
            except Exception:
                pass

async def broadcast_leaderboard(link_code: str):
    """현황판 데이터 브로드캐스트"""
    leaderboard = await get_leaderboard_data(link_code)
    await broadcast_to_game(link_code, {
        "type": "leaderboard",
        "data": leaderboard
    })

async def get_leaderboard_data(link_code: str) -> List[Dict[str, Any]]:
    """현황판 데이터 조회"""
    # DB 세션 생성
    db = SessionLocal()
    try:
        # 게임 조회
        game = db.query(Game).filter(Game.link_code == link_code).first()
        if not game:
            return []
        
        # 참여자 조회
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
    finally:
        db.close()