#!/bin/bash

# 가상 환경 활성화 스크립트의 경로를 지정합니다.
# 스크립트가 venv 디렉토리와 같은 위치에 있다고 가정합니다.
VENV_ACTIVATE="venv/bin/activate"

# 가상 환경 활성화 스크립트가 존재하는지 확인합니다.
if [ -f "$VENV_ACTIVATE" ]; then
  # 스크립트를 source하여 현재 셸에 환경을 적용합니다.
  source "$VENV_ACTIVATE"
  echo "가상 환경이 활성화되었습니다."
else
  echo "오류: 가상 환경 활성화 스크립트를 찾을 수 없습니다: $VENV_ACTIVATE"
fi
