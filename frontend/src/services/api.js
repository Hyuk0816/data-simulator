import axios from 'axios';

// API 기본 URL 설정
const API_BASE_URL = 'http://localhost:8000';

// axios 인스턴스 생성
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터 - 인증 토큰 자동 추가
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // 로그인 엔드포인트는 OAuth2 표준에 따라 form-data 사용
        if (config.url === '/api/auth/login' && config.method === 'post') {
            config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            // FormData로 변환
            if (config.data && !(config.data instanceof URLSearchParams)) {
                const params = new URLSearchParams();
                params.append('username', config.data.user_id);
                params.append('password', config.data.password);
                config.data = params;
            }
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
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            // 로그인 페이지가 아닌 경우에만 리다이렉트
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        
        // 에러 메시지 추출
        const errorMessage = error.response?.data?.detail || 
                            error.response?.data?.message || 
                            error.message || 
                            '알 수 없는 오류가 발생했습니다.';
        
        // 개발 환경에서 에러 로깅
        if (process.env.NODE_ENV === 'development') {
            console.error('API Error:', {
                url: error.config?.url,
                method: error.config?.method,
                status: error.response?.status,
                message: errorMessage
            });
        }
        
        return Promise.reject({
            status: error.response?.status,
            message: errorMessage,
            data: error.response?.data
        });
    }
);

// Auth API
export const authAPI = {
    // 회원가입
    register: (userData) => api.post('/api/auth/register', userData),
    
    // 로그인 (OAuth2 표준 form-data 형식)
    login: (credentials) => api.post('/api/auth/login', credentials),
    
    // 현재 사용자 정보 조회
    getMe: () => api.get('/api/auth/me'),
};

// User API
export const userAPI = {
    // 사용자 목록 조회
    getUsers: () => api.get('/api/users'),
    
    // 특정 사용자 조회
    getUser: (id) => api.get(`/api/users/${id}`),
    
    // 사용자 정보 수정
    updateUser: (id, userData) => api.put(`/api/users/${id}`, userData),
    
    // 사용자 삭제
    deleteUser: (id) => api.delete(`/api/users/${id}`),
};

// Simulator API
export const simulatorAPI = {
    // 시뮬레이터 목록 조회 (페이지네이션 지원)
    getSimulators: (skip = 0, limit = 100) => 
        api.get('/api/simulators', { params: { skip, limit } }),
    
    // 특정 시뮬레이터 조회
    getSimulator: (id) => api.get(`/api/simulators/${id}`),
    
    // 시뮬레이터 생성
    createSimulator: (data) => api.post('/api/simulators', data),
    
    // 시뮬레이터 업데이트
    updateSimulator: (id, data) => api.put(`/api/simulators/${id}`, data),
    
    // 시뮬레이터 삭제
    deleteSimulator: (id) => api.delete(`/api/simulators/${id}`),
    
    // 시뮬레이터 활성화 상태 토글
    toggleSimulator: (id) => api.patch(`/api/simulators/${id}/toggle`),
    
    // 시뮬레이터 데이터 조회 (공개 API)
    getSimulatorData: (userId, simulatorName) => 
        axios.get(`${API_BASE_URL}/api/data/${userId}/${simulatorName}`),
};

export default api;