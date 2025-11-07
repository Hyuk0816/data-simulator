# Python 3.11 공식 이미지 사용
FROM python:3.11-slim

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 패키지 업데이트 및 필요한 의존성 설치
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# requirements.txt 복사 및 Python 패키지 설치
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY . .

# 환경 변수 설정
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# 애플리케이션 포트 노출
EXPOSE 5555

# 서버 실행 (uvicorn 사용 - 로그 레벨 debug로 설정)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5555", "--reload", "--log-level", "debug"]