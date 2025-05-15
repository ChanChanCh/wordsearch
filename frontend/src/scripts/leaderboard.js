// 향상된 현황판 기능
class Leaderboard {
    constructor(containerId, currentUsername) {
        this.container = document.getElementById(containerId);
        this.currentUsername = currentUsername;
        this.data = [];
        this.sortedBy = 'score'; // 기본 정렬: 점수
        this.animationFrames = {};
        this.lastUpdate = {};
    }
    
    // 현황판 데이터 업데이트
    update(leaderboardData) {
        // 이전 상태 복사
        const previousData = [...this.data];
        
        // 새 데이터로 업데이트
        this.data = leaderboardData;
        
        // 데이터 정렬
        this.sortData();
        
        // 현황판 렌더링
        this.render(previousData);
    }
    
    // 데이터 정렬
    sortData() {
        if (this.sortedBy === 'score') {
            // 점수 내림차순, 완료 시간 오름차순
            this.data.sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                
                // 완료 시간이 있는 경우 빠른 시간 우선
                if (a.completion_time && b.completion_time) {
                    return a.completion_time - b.completion_time;
                } else if (a.completion_time) {
                    return -1;
                } else if (b.completion_time) {
                    return 1;
                }
                
                return 0;
            });
        } else if (this.sortedBy === 'time') {
            // 완료 시간 기준 정렬 (완료한 사용자만)
            const completed = this.data.filter(p => p.completion_time)
                .sort((a, b) => a.completion_time - b.completion_time);
            
            const notCompleted = this.data.filter(p => !p.completion_time)
                .sort((a, b) => b.score - a.score);
            
            this.data = [...completed, ...notCompleted];
        }
    }
    
    // 현황판 렌더링
    render(previousData = []) {
        // 기존 항목 맵 생성
        const existingItems = {};
        Array.from(this.container.children).forEach(el => {
            const id = el.dataset.id;
            existingItems[id] = el;
        });
        
        // 컨테이너 초기화
        this.container.innerHTML = '';
        
        // 각 항목 렌더링
        this.data.forEach((player, index) => {
            const rank = index + 1;
            const playerItem = this.createLeaderboardItem(player, rank);
            
            // 이전 상태와 비교하여 애니메이션 적용
            this.applyAnimations(playerItem, player, previousData);
            
            this.container.appendChild(playerItem);
        });
    }
    
    // 현황판 항목 생성
    createLeaderboardItem(player, rank) {
        const isSelf = player.username === this.currentUsername;
        const isTop3 = rank <= 3;
        
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.dataset.id = player.participant_id;
        
        if (isTop3) {
            item.classList.add('top');
            // 등수에 따른 특별 스타일
            if (rank === 1) item.classList.add('gold');
            if (rank === 2) item.classList.add('silver');
            if (rank === 3) item.classList.add('bronze');
        }
        
        if (isSelf) {
            item.classList.add('self');
        }
        
        // 등수 표시
        const rankContainer = document.createElement('div');
        rankContainer.className = 'leaderboard-rank';
        
        const rankNum = document.createElement('span');
        rankNum.textContent = rank;
        rankContainer.appendChild(rankNum);
        
        // 메달 아이콘 (상위 3위)
        if (isTop3) {
            const medalIcon = document.createElement('div');
            medalIcon.className = 'medal-icon';
            medalIcon.textContent = ['🥇', '🥈', '🥉'][rank - 1];
            rankContainer.appendChild(medalIcon);
        }
        
        // 사용자 정보
        const userInfo = document.createElement('div');
        userInfo.className = 'leaderboard-user-info';
        
        const username = document.createElement('div');
        username.className = 'leaderboard-username';
        username.textContent = player.username;
        
        const scoreContainer = document.createElement('div');
        scoreContainer.className = 'leaderboard-score-container';
        
        const scoreLabel = document.createElement('span');
        scoreLabel.className = 'score-label';
        scoreLabel.textContent = 'Score: ';
        
        const scoreValue = document.createElement('span');
        scoreValue.className = 'score-value';
        scoreValue.textContent = player.score;
        
        scoreContainer.appendChild(scoreLabel);
        scoreContainer.appendChild(scoreValue);
        
        userInfo.appendChild(username);
        userInfo.appendChild(scoreContainer);
        
        // 완료 시간 표시
        const timeInfo = document.createElement('div');
        timeInfo.className = 'leaderboard-time-info';
        
        if (player.completion_time) {
            const minutes = Math.floor(player.completion_time / 60).toString().padStart(2, '0');
            const seconds = Math.floor(player.completion_time % 60).toString().padStart(2, '0');
            
            const completionIcon = document.createElement('span');
            completionIcon.className = 'completion-icon';
            completionIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            
            const timeValue = document.createElement('span');
            timeValue.className = 'time-value';
            timeValue.textContent = `${minutes}:${seconds}`;
            
            timeInfo.appendChild(completionIcon);
            timeInfo.appendChild(timeValue);
        } else {
            const inProgressIcon = document.createElement('span');
            inProgressIcon.className = 'in-progress-icon';
            inProgressIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';
            
            const inProgressText = document.createElement('span');
            inProgressText.className = 'in-progress-text';
            inProgressText.textContent = 'In progress';
            
            timeInfo.appendChild(inProgressIcon);
            timeInfo.appendChild(inProgressText);
        }
        
        // 항목에 요소 추가
        item.appendChild(rankContainer);
        item.appendChild(userInfo);
        item.appendChild(timeInfo);
        
        return item;
    }
    
    // 애니메이션 적용
    applyAnimations(element, currentData, previousData) {
        const id = currentData.participant_id;
        
        // 이전 상태에서의 플레이어 데이터 찾기
        const prevPlayer = previousData.find(p => p.participant_id === id);
        
        // 신규 참가자 애니메이션
        if (!prevPlayer) {
            element.classList.add('new-player');
            setTimeout(() => {
                element.classList.remove('new-player');
            }, 3000);
            return;
        }
        
        // 점수 업데이트 애니메이션
        if (prevPlayer.score !== currentData.score) {
            const scoreElement = element.querySelector('.score-value');
            scoreElement.classList.add('score-updated');
            
            // 애니메이션 수치 업데이트
            this.animateNumberChange(
                scoreElement, 
                prevPlayer.score, 
                currentData.score, 
                `score-${id}`
            );
            
            setTimeout(() => {
                scoreElement.classList.remove('score-updated');
            }, 2000);
        }
        
        // 게임 완료 애니메이션
        if (!prevPlayer.completion_time && currentData.completion_time) {
            element.classList.add('game-completed');
            setTimeout(() => {
                element.classList.remove('game-completed');
            }, 3000);
        }
    }
    
    // 숫자 변경 애니메이션
    animateNumberChange(element, startValue, endValue, animationId) {
        // 이전 애니메이션 취소
        if (this.animationFrames[animationId]) {
            cancelAnimationFrame(this.animationFrames[animationId]);
        }
        
        const duration = 1500; // 애니메이션 지속 시간 (ms)
        const startTime = performance.now();
        
        const updateValue = (timestamp) => {
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 애니메이션 효과 (점점 느려지는 효과)
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            
            const currentValue = Math.floor(startValue + (endValue - startValue) * easedProgress);
            element.textContent = currentValue;
            
            if (progress < 1) {
                this.animationFrames[animationId] = requestAnimationFrame(updateValue);
            } else {
                delete this.animationFrames[animationId];
                element.textContent = endValue;
            }
        };
        
        this.animationFrames[animationId] = requestAnimationFrame(updateValue);
    }
    
    // 정렬 방식 변경
    setSortBy(sortType) {
        if (this.sortedBy !== sortType) {
            this.sortedBy = sortType;
            this.sortData();
            this.render();
            return true;
        }
        return false;
    }
}