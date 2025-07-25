import axios from 'axios';

// API 기본 URL 설정 - 개발 환경에서는 proxy를 사용
const API_BASE_URL = import.meta.env.DEV ? '/api' : 'http://localhost:8000/api';

// axios 인스턴스 생성
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터 - 인증 토큰 자동 추가
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 응답 인터셉터 - 인증 에러 처리
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // 인증 토큰이 만료되었거나 유효하지 않은 경우
            localStorage.removeItem('token');
            localStorage.removeItem('user_id');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
};

// Simulator API
export const simulatorAPI = {
    // 시뮬레이터 목록 조회
    getSimulators: () => api.get('/simulators'),
    
    // 시뮬레이터 생성
    createSimulator: (data) => api.post('/simulators', data),
    
    // 시뮬레이터 업데이트
    updateSimulator: (id, data) => api.put(`/simulators/${id}`, data),
    
    // 시뮬레이터 삭제
    deleteSimulator: (id) => api.delete(`/simulators/${id}`),
    
    // 시뮬레이터 데이터 조회 (공개 API)
    getSimulatorData: (userId, simulatorName) => 
        axios.get(`${API_BASE_URL}/data/${userId}-${simulatorName}`),
};

export default api;