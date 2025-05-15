import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.models import User, Game, GameWord, GameParticipant

# 테스트용 인메모리 DB 설정
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 테스트 데이터베이스 설정
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

# 테스트 사용자 데이터
test_user = {
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpassword"
}

# 테스트 게임 데이터
test_game = {
    "title": "Test Game",
    "description": "Test game description",
    "words": ["APPLE", "BANANA", "CHERRY", "ORANGE", "GRAPE"]
}

@pytest.fixture
def test_db():
    # 테스트 DB 설정
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def registered_user():
    # 사용자 등록
    response = client.post("/auth/register", json=test_user)
    return response.json()

@pytest.fixture
def auth_token(registered_user):
    # 로그인 및 토큰 획득
    login_data = {
        "username": test_user["username"],
        "password": test_user["password"]
    }
    response = client.post("/auth/token", data=login_data)
    token = response.json()["access_token"]
    return token

@pytest.fixture
def created_game(auth_token):
    # 게임 생성
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.post("/games", json=test_game, headers=headers)
    return response.json()

# 사용자 등록 테스트
def test_register_user(test_db):
    response = client.post("/auth/register", json=test_user)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == test_user["username"]
    assert data["email"] == test_user["email"]
    assert "password_hash" not in data

# 로그인 테스트
def test_login(test_db, registered_user):
    login_data = {
        "username": test_user["username"],
        "password": test_user["password"]
    }
    response = client.post("/auth/token", data=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

# 게임 생성 테스트
def test_create_game(test_db, auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.post("/games", json=test_game, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == test_game["title"]
    assert data["description"] == test_game["description"]
    assert "link_code" in data
    assert len(data["words"]) == len(test_game["words"])

# 게임 조회 테스트
def test_get_game(test_db, auth_token, created_game):
    game_id = created_game["id"]
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.get(f"/games/{game_id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == game_id
    assert data["title"] == test_game["title"]

# 링크로 게임 조회 테스트
def test_get_game_by_link(test_db, created_game):
    link_code = created_game["link_code"]
    response = client.get(f"/games/link/{link_code}")
    assert response.status_code == 200
    data = response.json()
    assert data["link_code"] == link_code
    assert data["title"] == test_game["title"]

# 게임 보드 생성 테스트
def test_create_board(test_db):
    board_data = {
        "size": 10,
        "words": test_game["words"]
    }
    response = client.post("/games/board", json=board_data)
    assert response.status_code == 200
    data = response.json()
    assert "board" in data
    assert "words" in data
    assert len(data["board"]) == 10
    assert len(data["words"]) == len(test_game["words"])

# 게임 참여 테스트
def test_join_game(test_db, created_game):
    link_code = created_game["link_code"]
    username = "player1"
    response = client.post(f"/play/{link_code}/join", json={"username": username})
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == username
    assert "participant_id" in data
    assert "game_id" in data

# 게임 데이터 조회 테스트
def test_get_game_data(test_db, created_game):
    link_code = created_game["link_code"]
    response = client.get(f"/play/{link_code}")
    assert response.status_code == 200
    data = response.json()
    assert "game" in data
    assert "board" in data
    assert "words" in data
    assert data["game"]["title"] == test_game["title"]
    assert len(data["words"]) == len(test_game["words"])

# 단어 검증 테스트
def test_verify_word(test_db, created_game):
    # 게임 참여
    link_code = created_game["link_code"]
    username = "player2"
    join_response = client.post(f"/play/{link_code}/join", json={"username": username})
    participant_id = join_response.json()["participant_id"]
    
    # 게임 데이터 조회
    game_data = client.get(f"/play/{link_code}").json()
    
    # 첫 번째 단어 검증
    word = game_data["words"][0]
    
    # 임의의 위치 생성 (실제로는 올바른 위치가 필요)
    positions = [{"row": 0, "col": i} for i in range(len(word))]
    
    verify_data = {
        "participant_id": participant_id,
        "word": word,
        "selected_positions": positions
    }
    
    response = client.post(f"/play/{link_code}/verify-word", json=verify_data)
    assert response.status_code == 200
    data = response.json()
    assert "word" in data
    assert "correct" in data
    # 실제 게임에서는 위치가 중요하므로 이 테스트에서는 correct가 True가 아닐 수 있음
    
# 게임 완료 테스트
def test_complete_game(test_db, created_game):
    # 게임 참여
    link_code = created_game["link_code"]
    username = "player3"
    join_response = client.post(f"/play/{link_code}/join", json={"username": username})
    participant_id = join_response.json()["participant_id"]
    
    # 게임 완료
    completion_data = {
        "participant_id": participant_id,
        "completion_time": 120.5  # 2분 30초
    }
    
    response = client.post(f"/play/{link_code}/complete", json=completion_data)
    assert response.status_code == 200
    data = response.json()
    assert data["participant_id"] == participant_id
    assert data["username"] == username
    assert data["completion_time"] == 120.5

# 현황판 조회 테스트
def test_get_leaderboard(test_db, created_game):
    link_code = created_game["link_code"]
    response = client.get(f"/play/{link_code}/leaderboard")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)