import random
from typing import List, Dict, Tuple, Optional, Any
import string

def generate_word_search(words: List[str], grid_size: int = 15) -> Tuple[List[List[str]], List[Dict[str, Any]]]:
    """
    단어 검색 게임 보드 생성
    
    Args:
        words: 배치할 단어 목록
        grid_size: 보드 크기 (grid_size x grid_size)
    
    Returns:
        (board, word_placements): 문자 행렬과 배치된 단어 정보
    """
    # 대문자로 변환 및 공백 제거
    words = [word.strip().upper() for word in words]
    
    # 빈 보드 초기화
    board = [['' for _ in range(grid_size)] for _ in range(grid_size)]
    word_placements = []
    
    # 방향 정의 (상하좌우 및 대각선)
    directions = [
        (0, 1),   # 오른쪽
        (1, 0),   # 아래쪽
        (1, 1),   # 오른쪽-아래
        (1, -1),  # 오른쪽-위
        (0, -1),  # 왼쪽
        (-1, 0),  # 위쪽
        (-1, -1), # 왼쪽-위
        (-1, 1)   # 왼쪽-아래
    ]
    
    # 단어 길이로 정렬하여 긴 단어부터 배치
    words.sort(key=len, reverse=True)
    
    # 각 단어 배치 시도
    for word in words:
        placed = False
        attempts = 0
        max_attempts = 100  # 최대 시도 횟수
        
        while not placed and attempts < max_attempts:
            attempts += 1
            
            # 랜덤 시작점 및 방향 선택
            row = random.randint(0, grid_size - 1)
            col = random.randint(0, grid_size - 1)
            direction = random.choice(directions)
            
            # 단어를 배치할 수 있는지 확인
            if can_place_word(board, word, row, col, direction, grid_size):
                # 단어 배치
                word_pos = place_word(board, word, row, col, direction)
                
                # 배치 정보 저장
                word_placements.append({
                    'word': word,
                    'positions': word_pos,
                    'start': {'row': row, 'col': col},
                    'end': {
                        'row': row + direction[0] * (len(word) - 1),
                        'col': col + direction[1] * (len(word) - 1)
                    },
                    'direction': get_direction_name(direction)
                })
                placed = True
        
        if not placed:
            # 단어를 배치할 수 없는 경우
            print(f"Warning: Could not place word '{word}' after {max_attempts} attempts")
    
    # 빈 칸을 랜덤 문자로 채우기
    fill_empty_cells(board, grid_size)
    
    return board, word_placements

def can_place_word(board: List[List[str]], word: str, row: int, col: int, direction: Tuple[int, int], grid_size: int) -> bool:
    """단어를 지정된 위치와 방향에 배치할 수 있는지 확인"""
    word_len = len(word)
    row_dir, col_dir = direction
    
    # 보드 경계 확인
    end_row = row + (word_len - 1) * row_dir
    end_col = col + (word_len - 1) * col_dir
    
    if end_row < 0 or end_row >= grid_size or end_col < 0 or end_col >= grid_size:
        return False
    
    # 각 문자 위치 확인
    for i in range(word_len):
        curr_row = row + i * row_dir
        curr_col = col + i * col_dir
        
        # 이미 채워진 셀이 있는 경우, 같은 문자인지 확인
        if board[curr_row][curr_col] and board[curr_row][curr_col] != word[i]:
            return False
    
    return True

def place_word(board: List[List[str]], word: str, row: int, col: int, direction: Tuple[int, int]) -> List[Dict[str, int]]:
    """단어를 보드에 배치하고 위치 반환"""
    row_dir, col_dir = direction
    positions = []
    
    for i, char in enumerate(word):
        curr_row = row + i * row_dir
        curr_col = col + i * col_dir
        board[curr_row][curr_col] = char
        positions.append({'row': curr_row, 'col': curr_col})
    
    return positions

def fill_empty_cells(board: List[List[str]], grid_size: int):
    """빈 셀을 랜덤 대문자로 채우기"""
    alphabet = string.ascii_uppercase
    
    for row in range(grid_size):
        for col in range(grid_size):
            if not board[row][col]:
                board[row][col] = random.choice(alphabet)

def get_direction_name(direction: Tuple[int, int]) -> str:
    """방향 튜플을 읽기 쉬운 이름으로 변환"""
    direction_names = {
        (0, 1): "right",
        (1, 0): "down",
        (1, 1): "down-right",
        (1, -1): "down-left",
        (0, -1): "left",
        (-1, 0): "up",
        (-1, -1): "up-left",
        (-1, 1): "up-right"
    }
    return direction_names.get(direction, "unknown")