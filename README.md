# Word Search Game

Word Search 게임을 생성하고 플레이할 수 있는 웹 애플리케이션입니다.

## 기능

- Word Search 게임 생성 (Word Search Maker)
- 생성된 게임 플레이
- 실시간 현황판
- 사용자 인증 및 점수 기록

## 기술 스택

### 백엔드
- Python
- FastAPI
- SQLAlchemy (ORM)
- WebSockets
- SQLite/MySQL

### 프론트엔드
- HTML/CSS/JavaScript
- Svelte

## 데이터 모델 (ERD)

+----------------+       +----------------+       +----------------+
|      User      |       |      Game      |       | GameParticipant|
+----------------+       +----------------+       +----------------+
| id (PK)        |       | id (PK)        |       | id (PK)        |
| username       |------>| creator_id (FK)|       | game_id (FK)   |
| email          |       | title          |<------| user_id (FK)   |
| password_hash  |       | description    |       | username       |
| created_at     |       | created_at     |       | score          |
| is_active      |       | link_code      |       | completion_time|
+----------------+       +----------------+       | created_at     |
                                |                 +----------------+
                                |                         
                                v                         
                         +----------------+       
                         |   GameWord     |       
                         +----------------+       
                         | id (PK)        |       
                         | game_id (FK)   |       
                         | word           |       
                         | position_data  |       
                         | created_at     |       
                         +----------------+

## 설치 및 실행 방법

### 백엔드 설치
```bash
cd backend
pip install -r requirements.txt
