# Node.js 22 공식 이미지 사용 (build stage) - Vite 7 요구사항
FROM node:22-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 필요한 시스템 패키지 설치
RUN apk add --no-cache python3 make g++

# package.json과 package-lock.json 복사
COPY package*.json ./

# node_modules와 package-lock.json 삭제 후 재설치
# esbuild 플랫폼별 바이너리 문제 해결
RUN rm -rf node_modules package-lock.json ~/.npm && \
    npm cache clean --force && \
    npm install --platform=linux --arch=x64 && \
    npm uninstall esbuild && \
    npm install esbuild@latest

# 애플리케이션 코드 복사
COPY . .

# 환경변수 설정 (빌드 시점에 주입)
ARG REACT_APP_API_URL=http://localhost:5555
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# React 애플리케이션 빌드
RUN npm run build

# nginx를 사용한 production stage
FROM nginx:alpine

# nginx 설정 파일 생성
RUN echo 'server { \
    listen 3001; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api { \
        proxy_pass http://dynamic-simulator-backend:5555; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
}' > /etc/nginx/conf.d/default.conf

# 빌드된 파일을 nginx html 디렉토리로 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 포트 노출
EXPOSE 3001

# nginx 실행
CMD ["nginx", "-g", "daemon off;"]