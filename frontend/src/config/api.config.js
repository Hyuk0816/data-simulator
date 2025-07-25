/**
 * API 설정 파일
 * 백엔드 서버 URL 및 공통 설정 관리
 */

const API_CONFIG = {
  // 개발 환경 백엔드 서버 URL
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  
  // API 엔드포인트
  ENDPOINTS: {
    AUTH: {
      REGISTER: '/api/auth/register',
      LOGIN: '/api/auth/login',
      ME: '/api/auth/me'
    },
    USERS: {
      BASE: '/api/users',
      BY_ID: (id) => `/api/users/${id}`
    },
    SIMULATORS: {
      BASE: '/api/simulators',
      BY_ID: (id) => `/api/simulators/${id}`,
      DATA: (userId, simName) => `/api/data/${userId}/${simName}`
    }
  },
  
  // 요청 타임아웃 설정 (밀리초)
  TIMEOUT: 30000,
  
  // 토큰 관련 설정
  TOKEN: {
    STORAGE_KEY: 'access_token',
    TYPE: 'bearer'
  }
};

export default API_CONFIG;