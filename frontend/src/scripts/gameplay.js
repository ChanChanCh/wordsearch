// Word Search 게임 플레이 로직
document.addEventListener('DOMContentLoaded', function() {
    // 게임 관련 상태
    const gameState = {
        linkCode: '',
        participantId: null,
        username: '',
        words: [],
        foundWords: [],
        board: [],
        selectedCells: [],
        startTime: null,
        timerInterval: null,
        gameCompleted: false,
        websocket: null
    };
    
    // DOM 요소
    const gameTitle = document.getElementById('game-title');
    const gameDescription = document.getElementById('game-description');
    const gameBoard = document.getElementById('game-board');
    const wordsList = document.getElementById('words-list');
    const wordMessage = document.getElementById('word-message');
    const leaderboard = document.getElementById('leaderboard');
    const timerElement = document.getElementById('timer');
    
    // 모달 요소
    const usernameModal = document.getElementById('username-modal');
    const usernameForm = document.getElementById('username-form');
    const usernameInput = document.getElementById('username-input');
    const completionModal = document.getElementById('completion-modal');
    const completionTime = document.getElementById('completion-time');
    const wordsFound = document.getElementById('words-found');
    const finalScore = document.getElementById('final-score');
    const finalRank = document.getElementById('final-rank');
    const playAgainBtn = document.getElementById('play-again-btn');
    
    // 링크 코드 가져오기
    const pathSegments = window.location.pathname.split('/');
    gameState.linkCode = pathSegments[pathSegments.length - 1];
    
    // 이벤트 리스너 등록
    usernameForm.addEventListener('submit', handleUsernameSubmit);
    gameBoard.addEventListener('mousedown', handleBoardMouseDown);
    gameBoard.addEventListener('mouseover', handleBoardMouseOver);
    document.addEventListener('mouseup', handleBoardMouseUp);
    playAgainBtn.addEventListener('click', resetGame);
    
    // 게임 초기화
    initGame();
    
    // 게임 초기화 함수
    async function initGame() {
        try {
            // 게임 데이터 로드
            const gameData = await api.get(`/play/${gameState.linkCode}`);
            
            // 게임 상태 초기화
            gameState.board = gameData.board;
            gameState.words = gameData.words;
            
            // 게임 정보 표시
            gameTitle.textContent = gameData.game.title;
            gameDescription.textContent = gameData.game.description || '';
            document.title = `${gameData.game.title} - Word Search Game`;
            
            // 사용자 이름 입력 모달 표시
            showUsernameModal();
        } catch (error) {
            console.error('Failed to load game:', error);
            alert('Error loading game: ' + error.message);
        }
    }
    
    // 사용자 이름 입력 모달 표시
    function showUsernameModal() {
        usernameModal.classList.remove('hidden');
        usernameInput.focus();
        
        // 이전에 저장된 사용자 이름이 있으면 불러오기
        const savedUsername = localStorage.getItem('wordSearchUsername');
        if (savedUsername) {
            usernameInput.value = savedUsername;
        }
    }
    
// 사용자 이름 제출 처리
    async function handleUsernameSubmit(e) {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        
        if (!username) {
            alert('Please enter your name');
            return;
        }
        
        try {
            // 게임 참여 API 호출
            const joinResponse = await api.post(`/play/${gameState.linkCode}/join`, {
                username: username
            });
            
            // 참여 정보 저장
            gameState.participantId = joinResponse.participant_id;
            gameState.username = username;
            
            // 나중을 위해 사용자 이름 로컬 저장소에 저장
            localStorage.setItem('wordSearchUsername', username);
            
            // 모달 닫기
            usernameModal.classList.add('hidden');
            
            // 게임 시작
            startGame();
        } catch (error) {
            console.error('Failed to join game:', error);
            alert('Error joining game: ' + error.message);
        }
    }
    
    // 게임 시작
    function startGame() {
        // 게임 보드 렌더링
        renderGameBoard();
        
        // 단어 목록 렌더링
        renderWordsList();
        
        // 타이머 시작
        startTimer();
        
        // WebSocket 연결 설정
        setupWebSocket();
    }
    
    // 게임 보드 렌더링
    function renderGameBoard() {
        gameBoard.innerHTML = '';
        
        // 보드 크기에 맞게 그리드 설정
        const boardSize = gameState.board.length;
        gameBoard.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
        
        // 각 셀 생성
        for (let row = 0; row < boardSize; row++) {
            for (let col = 0; col < boardSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'board-cell';
                cell.textContent = gameState.board[row][col];
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                gameBoard.appendChild(cell);
            }
        }
    }
    
    // 단어 목록 렌더링
    function renderWordsList() {
        wordsList.innerHTML = '';
        
        gameState.words.forEach(word => {
            const wordItem = document.createElement('li');
            wordItem.className = 'word-item';
            wordItem.textContent = word;
            wordItem.dataset.word = word;
            
            if (gameState.foundWords.includes(word)) {
                wordItem.classList.add('found');
            }
            
            wordsList.appendChild(wordItem);
        });
    }
    
    // 타이머 시작
    function startTimer() {
        gameState.startTime = new Date();
        
        gameState.timerInterval = setInterval(() => {
            const currentTime = new Date();
            const elapsedTime = Math.floor((currentTime - gameState.startTime) / 1000);
            
            const minutes = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
            const seconds = (elapsedTime % 60).toString().padStart(2, '0');
            
            timerElement.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }
    
    // WebSocket 연결 설정
    function setupWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/game/${gameState.linkCode}`;
        
        gameState.websocket = new WebSocket(wsUrl);
        
        gameState.websocket.onopen = function() {
            console.log('WebSocket connection established');
            
            // 참여자 정보 전송
            gameState.websocket.send(JSON.stringify({
                type: 'join',
                participant_id: gameState.participantId,
                username: gameState.username
            }));
        };
        
        gameState.websocket.onmessage = function(event) {
            const message = JSON.parse(event.data);
            
            // 메시지 유형에 따른 처리
            if (message.type === 'leaderboard') {
                updateLeaderboard(message.data);
            } else if (message.type === 'word_found') {
                showWordFoundNotification(message.data);
            }
        };
        
        gameState.websocket.onclose = function() {
            console.log('WebSocket connection closed');
        };
        
        gameState.websocket.onerror = function(error) {
            console.error('WebSocket error:', error);
        };
    }
    
    // 보드 마우스 이벤트 처리 (단어 선택 시작)
    function handleBoardMouseDown(e) {
        if (e.target.classList.contains('board-cell') && !gameState.gameCompleted) {
            // 이전 선택 초기화
            clearSelectedCells();
            
            // 새 선택 시작
            const cell = e.target;
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            selectCell(cell);
            gameState.selectedCells.push({ row, col, element: cell });
            
            // 드래그 모드 활성화
            gameState.isDragging = true;
        }
    }
    
    // 보드 마우스 이벤트 처리 (단어 선택 중)
    function handleBoardMouseOver(e) {
        if (gameState.isDragging && e.target.classList.contains('board-cell') && !gameState.gameCompleted) {
            const cell = e.target;
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            // 이미 선택된 셀인지 확인
            const isAlreadySelected = gameState.selectedCells.some(
                selectedCell => selectedCell.row === row && selectedCell.col === col
            );
            
            if (!isAlreadySelected) {
                // 직선 방향으로만 선택 가능하도록 확인
                const isValidSelection = isValidDirection(row, col);
                
                if (isValidSelection) {
                    selectCell(cell);
                    gameState.selectedCells.push({ row, col, element: cell });
                }
            }
        }
    }
    
    // 보드 마우스 이벤트 처리 (단어 선택 완료)
    function handleBoardMouseUp() {
        if (gameState.isDragging && !gameState.gameCompleted) {
            gameState.isDragging = false;
            
            // 선택한 셀에서 단어 구성
            const selectedWord = gameState.selectedCells
                .map(cell => gameState.board[cell.row][cell.col])
                .join('');
            
            // 선택한 위치 정보
            const selectedPositions = gameState.selectedCells.map(cell => ({
                row: cell.row,
                col: cell.col
            }));
            
            // 단어 확인
            verifyWord(selectedWord, selectedPositions);
        }
    }
    
    // 셀 선택
    function selectCell(cell) {
        cell.classList.add('selected');
    }
    
    // 선택된 셀 초기화
    function clearSelectedCells() {
        gameState.selectedCells.forEach(cell => {
            if (!cell.element.classList.contains('found')) {
                cell.element.classList.remove('selected');
            }
        });
        
        gameState.selectedCells = [];
    }
    
    // 유효한 선택 방향인지 확인
    function isValidDirection(row, col) {
        // 첫 번째 선택 이후에만 적용
        if (gameState.selectedCells.length < 1) {
            return true;
        }
        
        // 마지막 선택된 셀
        const lastCell = gameState.selectedCells[gameState.selectedCells.length - 1];
        
        // 첫 두 셀로부터 방향 결정
        if (gameState.selectedCells.length === 1) {
            // 이전 셀과 현재 셀의 행/열 차이 계산
            gameState.selectionDeltaRow = row - lastCell.row;
            gameState.selectionDeltaCol = col - lastCell.col;
            
            // 대각선, 가로, 세로 방향 모두 허용
            return (gameState.selectionDeltaRow !== 0 || gameState.selectionDeltaCol !== 0);
        } else {
            // 두 번째 셀 이후에는 같은 방향인지 확인
            const expectedRow = lastCell.row + gameState.selectionDeltaRow;
            const expectedCol = lastCell.col + gameState.selectionDeltaCol;
            
            return (row === expectedRow && col === expectedCol);
        }
    }
    
    // 단어 확인
    async function verifyWord(word, positions) {
        try {
            // 최소 2글자 이상인지 확인
            if (word.length < 2) {
                clearSelectedCells();
                return;
            }
            
            // 이미 찾은 단어인지 확인
            if (gameState.foundWords.includes(word)) {
                showMessage('You already found this word!', false);
                clearSelectedCells();
                return;
            }
            
            // API로 단어 확인
            const result = await api.post(`/play/${gameState.linkCode}/verify-word`, {
                participant_id: gameState.participantId,
                word: word,
                selected_positions: positions
            });
            
            if (result.correct) {
                // 맞은 경우
                handleCorrectWord(word, result.score);
            } else {
                // 틀린 경우
                showMessage(`'${word}' is not a valid word in this puzzle.`, false);
                clearSelectedCells();
            }
        } catch (error) {
            console.error('Failed to verify word:', error);
            showMessage('Error verifying word', false);
            clearSelectedCells();
        }
    }
    
    // 올바른 단어 처리
    function handleCorrectWord(word, score) {
        // 단어를 찾은 단어 목록에 추가
        gameState.foundWords.push(word);
        
        // 선택된 셀을 '찾음' 상태로 표시
        gameState.selectedCells.forEach(cell => {
            cell.element.classList.remove('selected');
            cell.element.classList.add('found');
        });
        
        // 단어 목록에서 단어 표시 업데이트
        const wordItem = wordsList.querySelector(`[data-word="${word}"]`);
        if (wordItem) {
            wordItem.classList.add('found');
        }
        
        // 성공 메시지 표시
        showMessage(`Found: ${word} (+${word.length * 10} points)`, true);
        
        // WebSocket으로 단어 찾음 이벤트 전송
        if (gameState.websocket && gameState.websocket.readyState === WebSocket.OPEN) {
            gameState.websocket.send(JSON.stringify({
                type: 'found_word',
                participant_id: gameState.participantId,
                username: gameState.username,
                word: word,
                score: score
            }));
            
            // 현황판 업데이트 요청
            gameState.websocket.send(JSON.stringify({
                type: 'update'
            }));
        }
        
        // 선택 초기화
        gameState.selectedCells = [];
        
        // 모든 단어를 찾았는지 확인
        checkGameCompletion();
    }
    
    // 메시지 표시
    function showMessage(text, isCorrect) {
        wordMessage.textContent = text;
        wordMessage.className = 'word-message';
        
        if (isCorrect) {
            wordMessage.classList.add('correct');
        } else {
            wordMessage.classList.add('wrong');
        }
        
        // 일정 시간 후 메시지 숨기기
        setTimeout(() => {
            wordMessage.textContent = '';
            wordMessage.className = 'word-message';
        }, 3000);
    }
    
    // 단어 찾음 알림 표시
    function showWordFoundNotification(data) {
        // 내가 찾은 단어가 아닌 경우에만 표시
        if (data.username !== gameState.username) {
            showMessage(`${data.username} found: ${data.word}`, true);
        }
    }
    
    // 현황판 업데이트
    function updateLeaderboard(leaderboardData) {
        leaderboard.innerHTML = '';
        
        leaderboardData.forEach((player, index) => {
            const rank = index + 1;
            const isSelf = player.username === gameState.username;
            const isTop3 = rank <= 3;
            
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            
            if (isTop3) {
                item.classList.add('top');
            }
            
            if (isSelf) {
                item.classList.add('self');
            }
            
            const rankSpan = document.createElement('span');
            rankSpan.className = 'leaderboard-rank';
            rankSpan.textContent = rank;
            
            const usernameSpan = document.createElement('span');
            usernameSpan.className = 'leaderboard-username';
            usernameSpan.textContent = player.username;
            
            const scoreSpan = document.createElement('span');
            scoreSpan.className = 'leaderboard-score';
            scoreSpan.textContent = player.score;
            
            item.appendChild(rankSpan);
            item.appendChild(usernameSpan);
            item.appendChild(scoreSpan);
            
            if (player.completion_time) {
                const timeSpan = document.createElement('span');
                timeSpan.className = 'leaderboard-time';
                
                const minutes = Math.floor(player.completion_time / 60).toString().padStart(2, '0');
                const seconds = Math.floor(player.completion_time % 60).toString().padStart(2, '0');
                
                timeSpan.textContent = `${minutes}:${seconds}`;
                item.appendChild(timeSpan);
            }
            
            leaderboard.appendChild(item);
        });
    }
    
    // 게임 완료 확인
    function checkGameCompletion() {
        if (gameState.foundWords.length >= gameState.words.length) {
            // 모든 단어를 찾았을 때 게임 완료
            completeGame();
        }
    }
    
    // 게임 완료 처리
    async function completeGame() {
        if (gameState.gameCompleted) return;
        
        gameState.gameCompleted = true;
        
        // 타이머 중지
        clearInterval(gameState.timerInterval);
        
        // 경과 시간 계산
        const currentTime = new Date();
        const elapsedSeconds = Math.floor((currentTime - gameState.startTime) / 1000);
        
        try {
            // 게임 완료 API 호출
            const result = await api.post(`/play/${gameState.linkCode}/complete`, {
                participant_id: gameState.participantId,
                completion_time: elapsedSeconds
            });
            
            // 현황판 업데이트 요청
            if (gameState.websocket && gameState.websocket.readyState === WebSocket.OPEN) {
                gameState.websocket.send(JSON.stringify({
                    type: 'update'
                }));
            }
            
            // 완료 결과 표시
            showCompletionModal(result, elapsedSeconds);
        } catch (error) {
            console.error('Failed to complete game:', error);
            alert('Error saving game results: ' + error.message);
        }
    }
    
    // 완료 모달 표시
    function showCompletionModal(result, elapsedSeconds) {
        // 시간 형식 변환
        const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
        const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');
        
        // 모달 내용 설정
        completionTime.textContent = `${minutes}:${seconds}`;
        wordsFound.textContent = `${gameState.foundWords.length}/${gameState.words.length}`;
        finalScore.textContent = result.score;
        
        // 순위 정보 조회
        fetchRankInfo(result.participant_id)
            .then(rank => {
                finalRank.textContent = rank || '-';
            })
            .catch(error => {
                console.error('Failed to fetch rank:', error);
                finalRank.textContent = '-';
            });
        
        // 모달 표시
        completionModal.classList.remove('hidden');
    }
    
    // 순위 정보 조회
    async function fetchRankInfo(participantId) {
        try {
            const leaderboardData = await api.get(`/play/${gameState.linkCode}/leaderboard`);
            
            // 참여자 ID로 순위 찾기
            for (let i = 0; i < leaderboardData.length; i++) {
                if (leaderboardData[i].participant_id === participantId) {
                    return i + 1;
                }
            }
            
            return null;
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
            return null;
        }
    }
    
    // 게임 재시작
    function resetGame() {
        location.reload();
    }
});