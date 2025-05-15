// 향상된 단어 목록 컴포넌트
class WordList {
    constructor(containerElement) {
        this.containerElement = containerElement;
        this.words = [];
        this.foundWords = new Set();
    }
    
    // 단어 목록 설정
    setWords(words) {
        this.words = words;
        this.render();
    }
    
    // 단어 목록 렌더링
    render() {
        this.containerElement.innerHTML = '';
        
        // 단어 항목 생성
        this.words.forEach(word => {
            const wordItem = document.createElement('li');
            wordItem.className = 'word-item';
            wordItem.dataset.word = word;
            
            const wordText = document.createElement('span');
            wordText.className = 'word-text';
            wordText.textContent = word;
            
            const wordStatus = document.createElement('span');
            wordStatus.className = 'word-status';
            
            if (this.foundWords.has(word)) {
                wordItem.classList.add('found');
                wordStatus.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            }
            
            wordItem.appendChild(wordText);
            wordItem.appendChild(wordStatus);
            this.containerElement.appendChild(wordItem);
        });
        
        // 진행 상태 업데이트
        this.updateProgress();
    }
    
    // 찾은 단어 표시
    markWordAsFound(word) {
        this.foundWords.add(word);
        
        // DOM 업데이트
        const wordItem = this.containerElement.querySelector(`[data-word="${word}"]`);
        if (wordItem) {
            wordItem.classList.add('found');
            
            const wordStatus = wordItem.querySelector('.word-status');
            if (wordStatus) {
                wordStatus.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            }
            
            // 애니메이션 효과
            wordItem.classList.add('word-found-animation');
            setTimeout(() => {
                wordItem.classList.remove('word-found-animation');
            }, 1500);
        }
        
// 진행 상태 업데이트
        this.updateProgress();
    }
    
    // 진행 상태 업데이트
    updateProgress() {
        // 진행률 계산
        const totalWords = this.words.length;
        const foundWordsCount = this.foundWords.size;
        const progressPercent = totalWords > 0 ? (foundWordsCount / totalWords) * 100 : 0;
        
        // 진행 상태 엘리먼트가 없으면 생성
        let progressElement = document.querySelector('.words-progress');
        if (!progressElement) {
            progressElement = document.createElement('div');
            progressElement.className = 'words-progress';
            
            const progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            
            const progressText = document.createElement('div');
            progressText.className = 'progress-text';
            
            progressElement.appendChild(progressBar);
            progressElement.appendChild(progressText);
            
            // 단어 목록 컨테이너 위에 추가
            this.containerElement.parentNode.insertBefore(progressElement, this.containerElement);
        }
        
        // 진행 상태 업데이트
        const progressBar = progressElement.querySelector('.progress-bar');
        progressBar.style.width = `${progressPercent}%`;
        
        const progressText = progressElement.querySelector('.progress-text');
        progressText.textContent = `${foundWordsCount}/${totalWords} (${Math.round(progressPercent)}%)`;
        
        // 완료 상태에 따른 스타일 적용
        if (foundWordsCount === totalWords) {
            progressElement.classList.add('completed');
        } else {
            progressElement.classList.remove('completed');
        }
    }
    
    // 모든 단어를 찾았는지 확인
    areAllWordsFound() {
        return this.foundWords.size === this.words.length;
    }
    
    // 찾은 단어 수
    getFoundWordsCount() {
        return this.foundWords.size;
    }
    
    // 전체 단어 수
    getTotalWordsCount() {
        return this.words.length;
    }
    
    // 단어 목록을 섞어서 표시
    shuffleWords() {
        // 단어 배열을 복사하여 섞기
        const shuffled = [...this.words].sort(() => Math.random() - 0.5);
        this.words = shuffled;
        this.render();
    }
    
    // 단어 강조 효과
    highlightWord(word) {
        const wordItems = this.containerElement.querySelectorAll('.word-item');
        
        // 모든 강조 효과 제거
        wordItems.forEach(item => {
            item.classList.remove('highlighted');
        });
        
        // 특정 단어 강조
        const targetItem = this.containerElement.querySelector(`[data-word="${word}"]`);
        if (targetItem) {
            targetItem.classList.add('highlighted');
            
            // 보이는 영역으로 스크롤
            targetItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            // 잠시 후 강조 효과 제거
            setTimeout(() => {
                targetItem.classList.remove('highlighted');
            }, 2000);
        }
    }
}