// 향상된 게임 보드 인터랙션
class GameBoard {
    constructor(boardElement, wordMessageElement, onWordSelected) {
        this.boardElement = boardElement;
        this.wordMessageElement = wordMessageElement;
        this.onWordSelected = onWordSelected;
        
        this.boardData = [];
        this.boardSize = 0;
        this.selectedCells = [];
        this.isDragging = false;
        this.selectionDirection = null;
        this.foundWordPositions = new Set();
        this.isGameCompleted = false;
        
        // 터치 대응
        this.touchStarted = false;
        
        // 이벤트 리스너
        this.setupEventListeners();
    }
    
    // 이벤트 리스너 설정
    setupEventListeners() {
        // 마우스 이벤트
        this.boardElement.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.boardElement.addEventListener('mouseover', this.handleMouseOver.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // 터치 이벤트
        this.boardElement.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.boardElement.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.boardElement.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // 컨텍스트 메뉴 방지
        this.boardElement.addEventListener('contextmenu', e => e.preventDefault());
    }
    
    // 보드 데이터 설정
    setBoard(boardData) {
        this.boardData = boardData;
        this.boardSize = boardData.length;
        this.renderBoard();
    }
    
    // 보드 렌더링
    renderBoard() {
        this.boardElement.innerHTML = '';
        
        // 보드 그리드 설정
        this.boardElement.style.gridTemplateColumns = `repeat(${this.boardSize}, 1fr)`;
        
        // 각 셀 생성
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'board-cell';
                cell.textContent = this.boardData[row][col];
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.dataset.index = `${row}-${col}`;
                
                // 애니메이션 지연 (물결 효과)
                const delay = (row + col) * 30;
                cell.style.animationDelay = `${delay}ms`;
                cell.classList.add('cell-appear');
                
                this.boardElement.appendChild(cell);
            }
        }
    }
    
    // 마우스 다운 이벤트 처리
    handleMouseDown(e) {
        if (this.isGameCompleted) return;
        
        if (e.target.classList.contains('board-cell')) {
            // 이전 선택 초기화
            this.clearSelection();
            
            // 새 선택 시작
            const cell = e.target;
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            this.selectCell(cell);
            this.selectedCells.push({ row, col, element: cell });
            
            // 드래그 모드 활성화
            this.isDragging = true;
        }
    }
    
    // 마우스 오버 이벤트 처리
    handleMouseOver(e) {
        if (!this.isDragging || this.isGameCompleted) return;
        
        if (e.target.classList.contains('board-cell')) {
            const cell = e.target;
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            // 이미 선택된 셀인지 확인
            const isAlreadySelected = this.selectedCells.some(
                selectedCell => selectedCell.row === row && selectedCell.col === col
            );
            
            if (!isAlreadySelected) {
                // 현재 선택 방향 확인 및 유효한 방향인지 검증
                const isValidSelection = this.validateSelection(row, col);
                
                if (isValidSelection) {
                    this.selectCell(cell);
                    this.selectedCells.push({ row, col, element: cell });
                    
                    // 현재 선택된 단어 표시
                    this.showCurrentWord();
                }
            }
        }
    }
    
    // 마우스 업 이벤트 처리
    handleMouseUp() {
        if (!this.isDragging || this.isGameCompleted) return;
        
        this.isDragging = false;
        
        // 선택한 단어 확인
        if (this.selectedCells.length >= 2) {
            const selectedWord = this.getSelectedWord();
            const selectedPositions = this.getSelectedPositions();
            
            // 단어 선택 콜백 호출
            this.onWordSelected(selectedWord, selectedPositions);
        } else {
            this.clearSelection();
        }
    }
    
    // 터치 시작 이벤트 처리
    handleTouchStart(e) {
        e.preventDefault();
        
        if (this.isGameCompleted) return;
        
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (element && element.classList.contains('board-cell')) {
            // 이전 선택 초기화
            this.clearSelection();
            
            // 새 선택 시작
            const row = parseInt(element.dataset.row);
            const col = parseInt(element.dataset.col);
            
            this.selectCell(element);
            this.selectedCells.push({ row, col, element });
            
            this.touchStarted = true;
        }
    }
    
    // 터치 이동 이벤트 처리
    handleTouchMove(e) {
        e.preventDefault();
        
        if (!this.touchStarted || this.isGameCompleted) return;
        
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (element && element.classList.contains('board-cell')) {
            const row = parseInt(element.dataset.row);
            const col = parseInt(element.dataset.col);
            
            // 이미 선택된 셀인지 확인
            const isAlreadySelected = this.selectedCells.some(
                selectedCell => selectedCell.row === row && selectedCell.col === col
            );
            
            if (!isAlreadySelected) {
                // 현재 선택 방향 확인 및 유효한 방향인지 검증
                const isValidSelection = this.validateSelection(row, col);
                
                if (isValidSelection) {
                    this.selectCell(element);
                    this.selectedCells.push({ row, col, element });
                    
                    // 현재 선택된 단어 표시
                    this.showCurrentWord();
                }
            }
        }
    }
    
    // 터치 종료 이벤트 처리
    handleTouchEnd(e) {
        if (!this.touchStarted || this.isGameCompleted) return;
        
        this.touchStarted = false;
        
        // 선택한 단어 확인
        if (this.selectedCells.length >= 2) {
            const selectedWord = this.getSelectedWord();
            const selectedPositions = this.getSelectedPositions();
            
            // 단어 선택 콜백 호출
            this.onWordSelected(selectedWord, selectedPositions);
        } else {
            this.clearSelection();
        }
    }
    
    // 셀 선택
    selectCell(element) {
        element.classList.add('selected');
        
        // 효과음 재생 (선택적)
        this.playSelectSound();
    }
    
    // 선택 초기화
    clearSelection() {
        this.selectedCells.forEach(cell => {
            // 이미 찾은 셀은 초기화하지 않음
            if (!this.isFoundCell(cell.row, cell.col)) {
                cell.element.classList.remove('selected');
            }
        });
        
        this.selectedCells = [];
        this.selectionDirection = null;
        this.wordMessageElement.textContent = '';
    }
    
    // 단어 선택 유효성 검증
    validateSelection(row, col) {
        // 첫 번째 선택 이후에만 방향 검증 적용
        if (this.selectedCells.length < 1) {
            return true;
        }
        
        // 마지막 선택된 셀
        const lastCell = this.selectedCells[this.selectedCells.length - 1];
        
        // 첫 두 셀로부터 방향 결정
        if (this.selectedCells.length === 1) {
            const deltaRow = row - lastCell.row;
            const deltaCol = col - lastCell.col;
            
            // 대각선, 가로, 세로 방향만 허용
            if (deltaRow !== 0 || deltaCol !== 0) {
                // 방향 정규화 (단위 벡터)
                const dirLength = Math.max(Math.abs(deltaRow), Math.abs(deltaCol));
                const normalizedDeltaRow = deltaRow / dirLength;
                const normalizedDeltaCol = deltaCol / dirLength;
                
                // 현재 선택 방향 저장
                this.selectionDirection = {
                    row: normalizedDeltaRow,
                    col: normalizedDeltaCol
                };
                
                return true;
            }
            return false;
        } else {
            // 두 번째 셀 이후에는 같은 방향만 허용
            const expectedRow = lastCell.row + this.selectionDirection.row;
            const expectedCol = lastCell.col + this.selectionDirection.col;
            
            return (Math.abs(row - expectedRow) < 0.1 && Math.abs(col - expectedCol) < 0.1);
        }
    }
    
    // 선택된 단어 가져오기
    getSelectedWord() {
        return this.selectedCells
            .map(cell => this.boardData[cell.row][cell.col])
            .join('');
    }
    
    // 선택된 위치 정보 가져오기
    getSelectedPositions() {
        return this.selectedCells.map(cell => ({
            row: cell.row,
            col: cell.col
        }));
    }
    
    // 현재 선택된 단어 표시
    showCurrentWord() {
        if (this.selectedCells.length > 1) {
            const currentWord = this.getSelectedWord();
            this.wordMessageElement.textContent = currentWord;
            this.wordMessageElement.className = 'word-message selecting';
        }
    }
    
    // 단어 메시지 표시
    showWordMessage(text, isCorrect) {
        this.wordMessageElement.textContent = text;
        this.wordMessageElement.className = 'word-message';
        
        if (isCorrect) {
            this.wordMessageElement.classList.add('correct');
            // 찾은 단어 효과음 재생
            this.playCorrectSound();
        } else {
            this.wordMessageElement.classList.add('wrong');
            // 틀린 단어 효과음 재생
            this.playWrongSound();
        }
        
        // 일정 시간 후 메시지 숨기기
        setTimeout(() => {
            this.wordMessageElement.textContent = '';
            this.wordMessageElement.className = 'word-message';
        }, 3000);
    }
    
    // 찾은 단어 표시
    markWordAsFound(positions) {
        // 현재 선택 초기화
        this.clearSelection();
        
        // 각 위치를 찾은 단어로 표시
        positions.forEach(pos => {
            const index = `${pos.row}-${pos.col}`;
            this.foundWordPositions.add(index);
            
            // 셀 찾기
            const cell = this.boardElement.querySelector(`[data-index="${index}"]`);
            if (cell) {
                cell.classList.remove('selected');
                cell.classList.add('found');
                
                // 애니메이션 효과
                cell.classList.add('word-found');
                setTimeout(() => {
                    cell.classList.remove('word-found');
                }, 1000);
            }
        });
    }
    
    // 이미 찾은 셀인지 확인
    isFoundCell(row, col) {
        return this.foundWordPositions.has(`${row}-${col}`);
    }
    
    // 게임 완료 처리
    setGameCompleted(isCompleted) {
        this.isGameCompleted = isCompleted;
        
        if (isCompleted) {
            this.boardElement.classList.add('game-completed');
            
            // 완료 축하 애니메이션
            this.showCompletionAnimation();
        }
    }
    
    // 완료 축하 애니메이션
    showCompletionAnimation() {
        // 모든 셀에 완료 애니메이션 적용
        const cells = this.boardElement.querySelectorAll('.board-cell');
        cells.forEach((cell, index) => {
            // 물결 패턴 애니메이션 (지연 효과)
            setTimeout(() => {
                cell.classList.add('completion-animate');
            }, index * 20);
        });
        
        // 축하 효과음 재생
        this.playCompletionSound();
    }
    
    // 효과음 재생 ( 시간남으면 추가.. )
    playSelectSound() {
        // Web Audio API를 사용한 효과음 재생 
    }
    
    playCorrectSound() {
        // Web Audio API를 사용한 효과음 재생 
    }
    
    playWrongSound() {
        // Web Audio API를 사용한 효과음 재생 
    }
    
    playCompletionSound() {
        // Web Audio API를 사용한 효과음 재생 
    }
}