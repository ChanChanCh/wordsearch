// Word Search Maker 페이지 로직
document.addEventListener('DOMContentLoaded', function() {
    // DOM 요소
    const gameForm = document.getElementById('game-form');
    const titleInput = document.getElementById('title');
    const descriptionInput = document.getElementById('description');
    const wordsContainer = document.getElementById('words-container');
    const addWordBtn = document.getElementById('add-word-btn');
    const previewBtn = document.getElementById('preview-btn');
    const createBtn = document.getElementById('create-btn');
    const previewContainer = document.getElementById('preview-container');
    const previewBoard = document.getElementById('preview-board');
    const previewWordsList = document.getElementById('preview-words-list');
    const backToEditBtn = document.getElementById('back-to-edit');
    const resultContainer = document.getElementById('result-container');
    const shareLinkInput = document.getElementById('share-link');
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const playLink = document.getElementById('play-link');

    // 인증 확인
    checkAuthentication();

    // 이벤트 리스너 등록
    addWordBtn.addEventListener('click', addWordInput);
    previewBtn.addEventListener('click', previewGame);
    backToEditBtn.addEventListener('click', backToEdit);
    gameForm.addEventListener('submit', createGame);
    copyLinkBtn.addEventListener('click', copyShareLink);

    // 초기 단어 입력 필드 이벤트 설정
    setupWordInputs();

    // 단어 입력 필드 추가
    function addWordInput() {
        const wordInputGroup = document.createElement('div');
        wordInputGroup.className = 'word-input-group';
        
        const wordInput = document.createElement('input');
        wordInput.type = 'text';
        wordInput.className = 'word-input';
        wordInput.placeholder = 'Enter a word';
        wordInput.required = true;
        
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-word-btn';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', function() {
            wordsContainer.removeChild(wordInputGroup);
            updateRemoveButtons();
        });
        
        wordInputGroup.appendChild(wordInput);
        wordInputGroup.appendChild(removeBtn);
        wordsContainer.appendChild(wordInputGroup);
        
        // 필드 업데이트 후 삭제 버튼 상태 갱신
        updateRemoveButtons();
        
        // 포커스 설정
        wordInput.focus();
    }
    
    // 단어 입력 필드 초기 설정
    function setupWordInputs() {
        // 기존 삭제 버튼에 이벤트 리스너 추가
        const removeButtons = wordsContainer.querySelectorAll('.remove-word-btn');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const wordInputGroup = btn.parentElement;
                wordsContainer.removeChild(wordInputGroup);
                updateRemoveButtons();
            });
        });
        
        updateRemoveButtons();
    }
    
    // 삭제 버튼 상태 업데이트 (최소 5개 단어 필요)
    function updateRemoveButtons() {
        const wordGroups = wordsContainer.querySelectorAll('.word-input-group');
        const minWords = 5;
        
        wordGroups.forEach(group => {
            const removeBtn = group.querySelector('.remove-word-btn');
            if (wordGroups.length <= minWords) {
                removeBtn.hidden = true;
            } else {
                removeBtn.hidden = false;
            }
        });
    }
    
    // 게임 미리보기
    async function previewGame(e) {
        e.preventDefault();
        
        // 폼 데이터 유효성 검사
        if (!validateForm()) {
            return;
        }
        
        // 단어 목록 수집
        const words = collectWords();
        
        try {
            // 게임 보드 생성 API 호출
            const response = await api.post('/games/board', {
                words: words,
                size: 15
            });
            
            // 보드 및 단어 정보 표시
            displayPreviewBoard(response.board, response.words);
            
            // 미리보기 표시
            gameForm.classList.add('hidden');
            previewContainer.classList.remove('hidden');
            resultContainer.classList.add('hidden');
        } catch (error) {
            alert('Error generating preview: ' + (error.message || 'Unknown error'));
            console.error(error);
        }
    }
    
    // 게임 생성
    async function createGame(e) {
        e.preventDefault();
        
        // 폼 데이터 유효성 검사
        if (!validateForm()) {
            return;
        }
        
        // 로딩 상태 표시
        createBtn.disabled = true;
        createBtn.textContent = 'Creating...';
        
        // 폼 데이터 수집
        const gameData = {
            title: titleInput.value.trim(),
            description: descriptionInput.value.trim(),
            words: collectWords()
        };
        
        try {
            // 게임 생성 API 호출
            const response = await api.post('/games', gameData);
            
            // 공유 링크 생성
            const gameUrl = `${window.location.origin}/play/${response.link_code}`;
            shareLinkInput.value = gameUrl;
            playLink.href = gameUrl;
            
            // 결과 화면 표시
            gameForm.classList.add('hidden');
            previewContainer.classList.add('hidden');
            resultContainer.classList.remove('hidden');
        } catch (error) {
            alert('Error creating game: ' + (error.message || 'Unknown error'));
            console.error(error);
        } finally {
            // 버튼 상태 복원
            createBtn.disabled = false;
            createBtn.textContent = 'Create Game';
        }
    }
    
    // 폼 유효성 검사
    function validateForm() {
        // 제목 확인
        if (!titleInput.value.trim()) {
            alert('Please enter a game title');
            titleInput.focus();
            return false;
        }
        
        // 단어 수집 및 확인
        const words = collectWords();
        
        // 최소 5개 단어 확인
        if (words.length < 5) {
            alert('Please enter at least 5 words');
            return false;
        }
        
        // 각 단어 유효성 확인 (알파벳만)
        const invalidWords = words.filter(word => !/^[A-Za-z]+$/.test(word));
        if (invalidWords.length > 0) {
            alert(`These words contain invalid characters (only letters A-Z allowed): ${invalidWords.join(', ')}`);
            return false;
        }
        
        return true;
    }
    
    // 단어 목록 수집
    function collectWords() {
        const inputs = wordsContainer.querySelectorAll('.word-input');
        const words = [];
        
        inputs.forEach(input => {
            const word = input.value.trim().toUpperCase();
            if (word && !words.includes(word)) {
                words.push(word);
            }
        });
        
        return words;
    }
    
    // 미리보기 보드 표시
    function displayPreviewBoard(board, wordPlacements) {
        // 보드 초기화
        previewBoard.innerHTML = '';
        
        // 보드 그리드 생성
        for (let row = 0; row < board.length; row++) {
            for (let col = 0; col < board[row].length; col++) {
                const cell = document.createElement('div');
                cell.className = 'board-cell';
                cell.textContent = board[row][col];
                cell.dataset.row = row;
                cell.dataset.col = col;
                previewBoard.appendChild(cell);
            }
        }
        
        // 보드 크기에 따라 그리드 설정
        previewBoard.style.gridTemplateColumns = `repeat(${board[0].length}, 1fr)`;
        
        // 단어 목록 표시
        previewWordsList.innerHTML = '';
        wordPlacements.forEach(placement => {
            const wordItem = document.createElement('li');
            wordItem.textContent = placement.word;
            previewWordsList.appendChild(wordItem);
        });
    }
    
    // 편집 모드로 돌아가기
    function backToEdit() {
        gameForm.classList.remove('hidden');
        previewContainer.classList.add('hidden');
    }
    
    // 공유 링크 복사
    function copyShareLink() {
        shareLinkInput.select();
        document.execCommand('copy');
        copyLinkBtn.textContent = 'Copied!';
        
        setTimeout(() => {
            copyLinkBtn.textContent = 'Copy';
        }, 2000);
    }
    
    // 인증 확인 함수
    function checkAuthentication() {
        const token = localStorage.getItem('token');
        
        if (!token) {
            // 로그인되지 않은 경우, 로그인 페이지로 리디렉션
            alert('You need to login to create a game');
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        }
    }
});