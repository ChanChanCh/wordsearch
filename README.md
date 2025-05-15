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

User: 사용자 정보를 저장

id: 사용자 고유 식별자
username: 사용자 이름
email: 사용자 이메일
password_hash: 암호화된 비밀번호
created_at: 계정 생성 시간
is_active: 계정 활성화 상태


Game: 생성된 Word Search 게임 정보를 저장

id: 게임 고유 식별자
creator_id: 게임 생성자(User)의 ID (외래 키)
title: 게임 제목
description: 게임 설명
created_at: 게임 생성 시간
link_code: 게임 공유 링크 코드


GameWord: 각 게임에 포함된 단어 정보를 저장

id: 단어 고유 식별자
game_id: 연결된 게임 ID (외래 키)
word: 실제 단어
position_data: 게임 보드에서의 단어 위치 데이터 (JSON)
created_at: 단어 추가 시간


GameParticipant: 게임 참여자 정보와 점수를 저장

id: 참여 기록 고유 식별자
game_id: 연결된 게임 ID (외래 키)
user_id: 참여한 사용자 ID (외래 키, 로그인한 경우)
username: 참여자 이름 (비로그인 사용자용)
score: 획득 점수
completion_time: 게임 완료 시간 (초 단위)
created_at: 참여 시간


## 설치 및 실행 방법

### 백엔드 설치
```bash
cd backend
pip install -r requirements.txt