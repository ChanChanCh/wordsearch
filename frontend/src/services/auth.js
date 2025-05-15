// 인증 관련 서비스
document.addEventListener('DOMContentLoaded', function() {
    // DOM 요소
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const usernameSpan = document.getElementById('username');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    // 로그인 모달
    const loginModal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    const loginUsername = document.getElementById('login-username');
    const loginPassword = document.getElementById('login-password');
    const googleLoginBtn = document.getElementById('google-login');
    
    // 회원가입 모달
    const signupModal = document.getElementById('signup-modal');
    const signupForm = document.getElementById('signup-form');
    const signupUsername = document.getElementById('signup-username');
    const signupEmail = document.getElementById('signup-email');
    const signupPassword = document.getElementById('signup-password');
    const signupConfirm = document.getElementById('signup-confirm');
    
    // 모달 닫기 버튼
    const closeButtons = document.querySelectorAll('.modal .close');
    
    // 초기 인증 상태 확인
    checkAuthState();
    
    // 이벤트 리스너 등록
    loginBtn.addEventListener('click', showLoginModal);
    signupBtn.addEventListener('click', showSignupModal);
    logoutBtn.addEventListener('click', logout);
    
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    googleLoginBtn.addEventListener('click', handleGoogleLogin);
    
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = btn.closest('.modal');
            modal.classList.add('hidden');
        });
    });
    
    // 인증 상태 확인
    async function checkAuthState() {
        const token = localStorage.getItem('token');
        
        if (token) {
            try {
                // 토큰 유효성 검증
                const response = await api.get('/auth/me');
                
                // 사용자 정보 표시
                usernameSpan.textContent = response.username;
                authButtons.classList.add('hidden');
                userMenu.classList.remove('hidden');
            } catch (error) {
                console.error('Auth check error:', error);
                // 토큰이 유효하지 않으면 제거
                localStorage.removeItem('token');
                authButtons.classList.remove('hidden');
                userMenu.classList.add('hidden');
            }
        } else {
            // 토큰 없음
            authButtons.classList.remove('hidden');
            userMenu.classList.add('hidden');
        }
    }
    
    // 로그인 모달 표시
    function showLoginModal() {
        loginModal.classList.remove('hidden');
        loginForm.reset();
        loginUsername.focus();
    }
    
    // 회원가입 모달 표시
    function showSignupModal() {
        signupModal.classList.remove('hidden');
        signupForm.reset();
        signupUsername.focus();
    }
    
    // 로그인 처리
    async function handleLogin(e) {
        e.preventDefault();
        
        const username = loginUsername.value.trim();
        const password = loginPassword.value;
        
        if (!username || !password) {
            alert('Please enter username and password');
            return;
        }
        
        try {
            // 폼 데이터 생성
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);
            
            // 직접 fetch 사용 (API 헬퍼가 FormData를 처리하지 않음)
            const response = await fetch(`${api.baseUrl}/auth/token`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Login failed');
            }
            
            const data = await response.json();
            
            // 토큰 저장
            localStorage.setItem('token', data.access_token);
            
            // 로그인 상태 업데이트
            checkAuthState();
            
            // 모달 닫기
            loginModal.classList.add('hidden');
            
            // 페이지 리로드 또는 리디렉션
            const redirectUrl = new URLSearchParams(window.location.search).get('redirect');
            if (redirectUrl) {
                window.location.href = redirectUrl;
            } else {
                window.location.reload();
            }
        } catch (error) {
            alert('Login failed: ' + error.message);
            console.error('Login error:', error);
        }
    }
    
    // 회원가입 처리
    async function handleSignup(e) {
        e.preventDefault();
        
        const username = signupUsername.value.trim();
        const email = signupEmail.value.trim();
        const password = signupPassword.value;
        const confirm = signupConfirm.value;
        
        // 기본 유효성 검사
        if (!username || !email || !password || !confirm) {
            alert('Please fill all fields');
            return;
        }
        
        if (password !== confirm) {
            alert('Passwords do not match');
            return;
        }
        
        try {
            const response = await api.post('/auth/register', {
                username,
                email,
                password
            });
            
            // 회원가입 성공 후 로그인
            alert('Registration successful! Please login.');
            
            // 회원가입 모달 닫고 로그인 모달 표시
            signupModal.classList.add('hidden');
            showLoginModal();
            
            // 로그인 필드에 사용자 이름 미리 입력
            loginUsername.value = username;
            loginPassword.focus();
        } catch (error) {
            alert('Registration failed: ' + error.message);
            console.error('Signup error:', error);
        }
    }
    
    // Google 로그인 처리
    async function handleGoogleLogin() {
        try {
            // Google 로그인 URL 가져오기
            const response = await api.get('/auth/google/login');
            
            // Google 로그인 페이지로 리디렉션
            window.location.href = response.authorization_url;
        } catch (error) {
            alert('Google login failed: ' + error.message);
            console.error('Google login error:', error);
        }
    }
    
    // 로그아웃 처리
    function logout() {
        // 토큰 제거
        localStorage.removeItem('token');
        
        // 인증 상태 업데이트
        checkAuthState();
        
        // 홈페이지로 리디렉션
        window.location.href = '/';
    }
});