/**
 * 인증 관련 서비스 레이어
 * 로그인, 회원가입, 토큰 관리 등의 비즈니스 로직
 */
import { authAPI } from './api';

// 토큰 및 사용자 정보 관리
const TOKEN_KEY = 'access_token';
const USER_KEY = 'user';

const authService = {
  /**
   * 회원가입
   * @param {Object} userData - 회원가입 데이터
   * @param {string} userData.name - 사용자 이름
   * @param {string} userData.user_id - 사용자 ID
   * @param {string} userData.password - 비밀번호
   * @param {string} userData.password_confirm - 비밀번호 확인
   * @returns {Promise<Object>} 사용자 정보
   */
  async register(userData) {
    try {
      const response = await authAPI.register(userData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || '회원가입에 실패했습니다.');
    }
  },

  /**
   * 로그인
   * @param {Object} credentials - 로그인 정보
   * @param {string} credentials.user_id - 사용자 ID
   * @param {string} credentials.password - 비밀번호
   * @returns {Promise<Object>} 토큰 및 사용자 정보
   */
  async login(credentials) {
    try {
      // 로그인 API 호출
      const response = await authAPI.login(credentials);
      const { access_token, token_type } = response.data;

      // 토큰 저장
      this.setToken(access_token);

      // 사용자 정보 조회 및 저장
      const userInfo = await this.getCurrentUser();
      this.setUser(userInfo);

      return {
        token: access_token,
        tokenType: token_type,
        user: userInfo
      };
    } catch (error) {
      throw new Error(error.message || '로그인에 실패했습니다.');
    }
  },

  /**
   * 로그아웃
   */
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // 로그인 페이지로 리다이렉트
    window.location.href = '/login';
  },

  /**
   * 현재 사용자 정보 조회
   * @returns {Promise<Object>} 사용자 정보
   */
  async getCurrentUser() {
    try {
      const response = await authAPI.getMe();
      return response.data;
    } catch (error) {
      throw new Error(error.message || '사용자 정보를 불러올 수 없습니다.');
    }
  },

  /**
   * 토큰 저장
   * @param {string} token - JWT 토큰
   */
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  /**
   * 토큰 조회
   * @returns {string|null} JWT 토큰
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * 사용자 정보 저장
   * @param {Object} user - 사용자 정보
   */
  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  /**
   * 사용자 정보 조회
   * @returns {Object|null} 사용자 정보
   */
  getUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  /**
   * 인증 상태 확인
   * @returns {boolean} 로그인 여부
   */
  isAuthenticated() {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  },

  /**
   * 토큰 만료 여부 확인
   * @returns {boolean} 토큰 만료 여부
   */
  isTokenExpired() {
    const token = this.getToken();
    if (!token) return true;

    try {
      // JWT 페이로드 디코딩 (간단한 방식)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      // 토큰 파싱 실패 시 만료된 것으로 간주
      return true;
    }
  },

  /**
   * 자동 로그인 확인 (새로고침 시 등)
   * @returns {Promise<Object|null>} 사용자 정보 또는 null
   */
  async checkAuthStatus() {
    if (!this.isAuthenticated() || this.isTokenExpired()) {
      this.logout();
      return null;
    }

    try {
      // 서버에서 사용자 정보 재조회하여 토큰 유효성 검증
      const userInfo = await this.getCurrentUser();
      this.setUser(userInfo);
      return userInfo;
    } catch (error) {
      // 토큰이 유효하지 않은 경우 로그아웃
      this.logout();
      return null;
    }
  }
};

export default authService;