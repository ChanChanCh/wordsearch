// 향상된 Word Search 게임 플레이 로직
document.addEventListener('DOMContentLoaded', function() {
    // 게임 관련 상태
    const gameState = {
        linkCode: '',
        participantId: null,
        username: '',
        words: [],
        foundWords: new Set(),
        board: [],
        startTime: null,
        timerInterval: null,
        gameCompleted: false,
        websocket: null
    };
    
    // 컴포넌트 인스턴스
    let gameBoard;
    let wordList;
    let leaderboard;
    let accessibility;
    
    // DOM 요소
    const gameTitle = document.getElementById('game-title');
    const gameDescription = document.getElementById('game-description');
    const gameBoardEl = document.getElementById('game-board');
    const wordsListEl = document.getElementById('words-list');
    const wordMessageEl = document.getElementById('word-message');
    const leaderboardEl = document.getElementById('leaderboard');
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
    playAgainBtn.addEventListener('click', resetGame);
    
    // 게임 초기화
    initGame();
    
    // 게임 초기화 함수
    async function initGame() {
        try {
            // 접근성 설정 초기화
            accessibility = new GameAccessibility();
            accessibility.init();
            
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
            showErrorMessage('Error loading game', error.message);
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
            showErrorMessage('Username required', 'Please enter your name to join the game');
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
            showErrorMessage('Error joining game', error.message);
        }
    }
    
    // 게임 시작
    function startGame() {
        // 게임 컴포넌트 초기화
        initGameComponents();
        
        // 타이머 시작
        startTimer();
        
        // WebSocket 연결 설정
        setupWebSocket();
    }
    
    // 게임 컴포넌트 초기화
    function initGameComponents() {
        // 게임 보드 초기화
        gameBoard = new GameBoard(gameBoardEl, wordMessageEl, handleWordSelected);
        gameBoard.setBoard(gameState.board);
        
        // 단어 목록 초기화
        wordList = new WordList(wordsListEl);
        wordList.setWords(gameState.words);
        
        // 현황판 초기화
        leaderboard = new Leaderboard('leaderboard', gameState.username);
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
            
            // 5분 이상 지나면 타이머에 강조 효과
            if (elapsedTime >= 300) {
                timerElement.classList.add('urgent');
            }
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
                leaderboard.update(message.data);
            } else if (message.type === 'word_found') {
                handleWordFoundNotification(message.data);
            }
        };
        
        gameState.websocket.onclose = function() {
            console.log('WebSocket connection closed');
            
            // 자동 재연결 시도 (선택적)
            setTimeout(() => {
                if (!gameState.gameCompleted) {
                    setupWebSocket();
                }
            }, 3000);
        };
        
        gameState.websocket.onerror = function(error) {
            console.error('WebSocket error:', error);
        };
    }
    
    // 단어 선택 처리
    async function handleWordSelected(word, positions) {
        // 이미 찾은 단어인지 확인
        if (gameState.foundWords.has(word)) {
            gameBoard.showWordMessage('You already found this word!', false);
            return;
        }
        
        try {
            // API로 단어 확인
            const result = await api.post(`/play/${gameState.linkCode}/verify-word`, {
                participant_id: gameState.participantId,
                word: word,
                selected_positions: positions
            });
            
            if (result.correct) {
                // 맞은 경우
                handleCorrectWord(word, positions, result.score);
            } else {
                // 틀린 경우
                gameBoard.showWordMessage(`'${word}' is not a valid word in this puzzle.`, false);
            }
        } catch (error) {
            console.error('Failed to verify word:', error);
            gameBoard.showWordMessage('Error verifying word', false);
        }
    }
    
    // 올바른 단어 처리
    function handleCorrectWord(word, positions, score) {
        // 단어를 찾은 단어 목록에 추가
        gameState.foundWords.add(word);
        
        // 게임 보드에 찾은 단어 표시
        gameBoard.markWordAsFound(positions);
        
        // 단어 목록에서 단어 표시 업데이트
        wordList.markWordAsFound(word);
        
        // 성공 메시지 표시
        gameBoard.showWordMessage(`Found: ${word} (+${word.length * 10} points)`, true);
        
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
        
        // 모든 단어를 찾았는지 확인
        checkGameCompletion();
    }
    
    // 단어 찾음 알림 표시
    function handleWordFoundNotification(data) {
        // 내가 찾은 단어가 아닌 경우에만 표시
        if (data.username !== gameState.username) {
            gameBoard.showWordMessage(`${data.username} found: ${data.word}`, true);
        }
    }
    
    // 게임 완료 확인
    function checkGameCompletion() {
        if (wordList.areAllWordsFound()) {
            // 모든 단어를 찾았을 때 게임 완료
            completeGame();
        }
    }
    
    // 게임 완료 처리
    async function completeGame() {
        if (gameState.gameCompleted) return;
        
        gameState.gameCompleted = true;
        
        // 게임 보드에 완료 상태 설정
        gameBoard.setGameCompleted(true);
        
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
            showErrorMessage('Error saving game results', error.message);
        }
    }
    
    // 완료 모달 표시
    function showCompletionModal(result, elapsedSeconds) {
        // 시간 형식 변환
        const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
        const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');
        
        // 모달 내용 설정
        completionTime.textContent = `${minutes}:${seconds}`;
        wordsFound.textContent = `${gameState.foundWords.size}/${gameState.words.length}`;
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
    
    // 오류 메시지 표시
    function showErrorMessage(title, message) {
        // 기존 오류 모달 있는지 확인
        let errorModal = document.getElementById('error-modal');
        
        // 없으면 새로 생성
        if (!errorModal) {
            errorModal = document.createElement('div');
            errorModal.id = 'error-modal';
            errorModal.className = 'modal';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content error-modal';
            
            modalContent.innerHTML = `
                <h2 id="error-title">Error</h2>
                <p id="error-message"></p>
                <div class="modal-actions">
                    <button id="error-close" class="btn">Close</button>
                </div>
            `;
            
            errorModal.appendChild(modalContent);
            document.body.appendChild(errorModal);
            
            // 닫기 버튼 이벤트 리스너
            const closeBtn = errorModal.querySelector('#error-close');
            closeBtn.addEventListener('click', () => {
                errorModal.classList.add('hidden');
            });
        }
        
        // 오류 정보 설정
        const errorTitle = errorModal.querySelector('#error-title');
        const errorMessage = errorModal.querySelector('#error-message');
        
        errorTitle.textContent = title || 'Error';
        errorMessage.textContent = message || 'An unknown error occurred';
        
        // 모달 표시
        errorModal.classList.remove('hidden');
    }
    
    // 게임 재시작
    function resetGame() {
        location.reload();
    }
});