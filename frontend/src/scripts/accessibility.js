// 접근성 개선 및 테마 전환 기능
class GameAccessibility {
    constructor() {
        this.currentTheme = 'light'; // 기본 테마
        this.fontSize = 'medium'; // 기본 폰트 크기
        this.highContrast = false; // 고대비 모드
        this.soundEnabled = true; // 소리 활성화
        
        // 설정 버튼 초기화
        this.initSettingsButton();
    }
    
    // 설정 버튼 초기화
    initSettingsButton() {
        // 설정 버튼 생성
        const settingsButton = document.createElement('button');
        settingsButton.className = 'settings-button';
        settingsButton.setAttribute('aria-label', 'Accessibility settings');
        settingsButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
        `;
        
        // 헤더에 버튼 추가
        const header = document.querySelector('header');
        if (header) {
            header.appendChild(settingsButton);
        }
        
        // 클릭 이벤트 리스너 추가
        settingsButton.addEventListener('click', () => {
            this.showSettingsModal();
        });
    }
    
    // 설정 모달 표시
    showSettingsModal() {
        // 이미 있는 모달 확인
        let modal = document.getElementById('settings-modal');
        
        // 없으면 새로 생성
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'settings-modal';
            modal.className = 'modal';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            
            modalContent.innerHTML = `
                <h2>Accessibility Settings</h2>
                
                <div class="settings-section">
                    <h3>Theme</h3>
                    <div class="settings-options">
                        <button id="theme-light" class="theme-button ${this.currentTheme === 'light' ? 'active' : ''}">
                            <span class="theme-icon light"></span>
                            Light
                        </button>
                        <button id="theme-dark" class="theme-button ${this.currentTheme === 'dark' ? 'active' : ''}">
                            <span class="theme-icon dark"></span>
                            Dark
                        </button>
                        <button id="theme-sepia" class="theme-button ${this.currentTheme === 'sepia' ? 'active' : ''}">
                            <span class="theme-icon sepia"></span>
                            Sepia
                        </button>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>Font Size</h3>
                    <div class="settings-options">
                        <button id="font-small" class="font-button ${this.fontSize === 'small' ? 'active' : ''}">Small</button>
                        <button id="font-medium" class="font-button ${this.fontSize === 'medium' ? 'active' : ''}">Medium</button>
                        <button id="font-large" class="font-button ${this.fontSize === 'large' ? 'active' : ''}">Large</button>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>Other Settings</h3>
                    <div class="settings-toggles">
                        <div class="toggle-option">
                            <label for="high-contrast">High Contrast</label>
                            <label class="switch">
                                <input type="checkbox" id="high-contrast" ${this.highContrast ? 'checked' : ''}>
                                <span class="slider round"></span>
                            </label>
                        </div>
                        <div class="toggle-option">
                            <label for="sound-effects">Sound Effects</label>
                            <label class="switch">
                                <input type="checkbox" id="sound-effects" ${this.soundEnabled ? 'checked' : ''}>
                                <span class="slider round"></span>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="settings-actions">
                    <button id="close-settings" class="btn btn-primary">Save & Close</button>
                </div>
            `;
            
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
            
            // 이벤트 리스너 추가
            this.addSettingsEventListeners(modal);
        }
        
        // 모달 표시
        modal.classList.remove('hidden');
    }
    
    // 설정 이벤트 리스너 추가
    addSettingsEventListeners(modal) {
        // 테마 버튼
        const lightThemeBtn = modal.querySelector('#theme-light');
        const darkThemeBtn = modal.querySelector('#theme-dark');
        const sepiaThemeBtn = modal.querySelector('#theme-sepia');
        
        lightThemeBtn.addEventListener('click', () => this.setTheme('light'));
        darkThemeBtn.addEventListener('click', () => this.setTheme('dark'));
        sepiaThemeBtn.addEventListener('click', () => this.setTheme('sepia'));
        
        // 폰트 크기 버튼
        const smallFontBtn = modal.querySelector('#font-small');
        const mediumFontBtn = modal.querySelector('#font-medium');
        const largeFontBtn = modal.querySelector('#font-large');
        
        smallFontBtn.addEventListener('click', () => this.setFontSize('small'));
        mediumFontBtn.addEventListener('click', () => this.setFontSize('medium'));
        largeFontBtn.addEventListener('click', () => this.setFontSize('large'));
        
        // 토글 스위치
        const highContrastToggle = modal.querySelector('#high-contrast');
        const soundToggle = modal.querySelector('#sound-effects');
        
        highContrastToggle.addEventListener('change', () => {
            this.setHighContrast(highContrastToggle.checked);
        });
        
        soundToggle.addEventListener('change', () => {
            this.setSoundEnabled(soundToggle.checked);
        });
        
        // 닫기 버튼
        const closeBtn = modal.querySelector('#close-settings');
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            
            // 설정 저장
            this.saveSettings();
        });
    }
    
    // 테마 설정
    setTheme(theme) {
        // 이전 테마 제거
        document.body.classList.remove(`theme-${this.currentTheme}`);
        
        // 새 테마 적용
        this.currentTheme = theme;
        document.body.classList.add(`theme-${theme}`);
        
        // 버튼 상태 업데이트
        const modal = document.getElementById('settings-modal');
        if (modal) {
            const themeButtons = modal.querySelectorAll('.theme-button');
            themeButtons.forEach(btn => btn.classList.remove('active'));
            
            const activeButton = modal.querySelector(`#theme-${theme}`);
            if (activeButton) {
                activeButton.classList.add('active');
            }
        }
    }
    
    // 폰트 크기 설정
    setFontSize(size) {
        // 이전 크기 제거
        document.body.classList.remove(`font-${this.fontSize}`);
        
        // 새 크기 적용
        this.fontSize = size;
        document.body.classList.add(`font-${size}`);
        
        // 버튼 상태 업데이트
        const modal = document.getElementById('settings-modal');
        if (modal) {
            const fontButtons = modal.querySelectorAll('.font-button');
            fontButtons.forEach(btn => btn.classList.remove('active'));
            
            const activeButton = modal.querySelector(`#font-${size}`);
            if (activeButton) {
                activeButton.classList.add('active');
            }
        }
    }
    
    // 고대비 모드 설정
    setHighContrast(enabled) {
        this.highContrast = enabled;
        
        if (enabled) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
    }
    
    // 소리 설정
    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
        
        // 전역 이벤트 발행
        const event = new CustomEvent('soundSettingChanged', {
            detail: { enabled: enabled }
        });
        document.dispatchEvent(event);
    }
    
    // 설정 저장
    saveSettings() {
        const settings = {
            theme: this.currentTheme,
            fontSize: this.fontSize,
            highContrast: this.highContrast,
            soundEnabled: this.soundEnabled
        };
        
        localStorage.setItem('gameAccessibilitySettings', JSON.stringify(settings));
    }
    
    // 설정 불러오기
    loadSettings() {
        const savedSettings = localStorage.getItem('gameAccessibilitySettings');
        
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            
            // 설정 적용
            this.setTheme(settings.theme || 'light');
            this.setFontSize(settings.fontSize || 'medium');
            this.setHighContrast(settings.highContrast || false);
            this.setSoundEnabled(settings.soundEnabled !== undefined ? settings.soundEnabled : true);
        }
    }
    
    // 초기화
    init() {
        this.loadSettings();
        
        // 접근성 키보드 단축키 설정
        document.addEventListener('keydown', (e) => {
            // Alt + A: 접근성 메뉴 열기
            if (e.altKey && e.key === 'a') {
                e.preventDefault();
                this.showSettingsModal();
            }
        });
    }
}