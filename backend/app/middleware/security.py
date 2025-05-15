from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.base import BaseHTTPMiddleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.types import ASGIApp
import time
import os
from typing import Callable, List
import secrets

# 환경 변수에서 허용된 도메인 목록 가져오기
def get_allowed_origins():
    origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8000")
    return origins_str.split(",")

# 보안 헤더 미들웨어
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next: Callable):
        response = await call_next(request)
        
        # 보안 관련 HTTP 헤더 추가
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss:;"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        
        return response

# 속도 제한 미들웨어
class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, limit: int = 100, window: int = 60):
        super().__init__(app)
        self.limit = limit  # 윈도우당 최대 요청 수
        self.window = window  # 시간 윈도우 (초)
        self.requests = {}  # IP별 요청 기록
    
    async def dispatch(self, request: Request, call_next: Callable):
        # 클라이언트 IP 주소 가져오기
        ip = request.client.host
        
        # 현재 시간
        now = time.time()
        
        # 요청 기록이 없으면 초기화
        if ip not in self.requests:
            self.requests[ip] = []
        
        # 시간 윈도우 이전의 요청 제거
        self.requests[ip] = [req_time for req_time in self.requests[ip] if now - req_time < self.window]
        
        # 속도 제한 체크
        if len(self.requests[ip]) >= self.limit:
            return Response(
                content="Rate limit exceeded. Please try again later.",
                status_code=429,
                headers={"Retry-After": str(self.window)}
            )
        
        # 현재 요청 추가
        self.requests[ip].append(now)
        
        # 다음 미들웨어 호출
        return await call_next(request)

# CSRF 방지 미들웨어
class CSRFMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, excluded_paths: List[str] = None):
        super().__init__(app)
        self.excluded_paths = excluded_paths or ["/docs", "/redoc", "/openapi.json"]
    
    async def dispatch(self, request: Request, call_next: Callable):
        # 제외된 경로는 CSRF 검사 안함
        for path in self.excluded_paths:
            if request.url.path.startswith(path):
                return await call_next(request)
        
        # GET, HEAD, OPTIONS 메서드는 CSRF 검사 안함
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return await call_next(request)
        
        # CSRF 토큰 검사
        csrf_token = request.headers.get("X-CSRF-Token") or request.cookies.get("csrf_token")
        session_token = request.session.get("csrf_token") if hasattr(request, "session") else None
        
        if not csrf_token or not session_token or csrf_token != session_token:
            return Response(
                content="CSRF token missing or invalid",
                status_code=403
            )
        
        return await call_next(request)

# 응용 프로그램에 보안 미들웨어 적용
def add_security_middleware(app: FastAPI):
    # CORS 미들웨어
    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_allowed_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # 세션 미들웨어
    app.add_middleware(
        SessionMiddleware,
        secret_key=os.getenv("SECRET_KEY", secrets.token_hex(32))
    )
    
    # 보안 헤더 미들웨어
    app.add_middleware(SecurityHeadersMiddleware)
    
    # 속도 제한 미들웨어 (Production 환경에서만 활성화)
    if os.getenv("ENVIRONMENT", "development") == "production":
        app.add_middleware(
            RateLimitMiddleware,
            limit=int(os.getenv("RATE_LIMIT", "100")),
            window=int(os.getenv("RATE_LIMIT_WINDOW", "60"))
        )
    
    # CSRF 방지 미들웨어 (Production 환경에서만 활성화)
    if os.getenv("ENVIRONMENT", "development") == "production":
        app.add_middleware(CSRFMiddleware)
    
    return app