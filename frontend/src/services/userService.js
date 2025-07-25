/**
 * 사용자 관리 서비스 레이어
 * 사용자 정보 수정, 삭제 등의 비즈니스 로직
 */
import { userAPI } from './api';

const userService = {
  /**
   * 사용자 목록 조회
   * @returns {Promise<Array>} 사용자 목록
   */
  async getUsers() {
    try {
      const response = await userAPI.getUsers();
      return response.data;
    } catch (error) {
      throw new Error(error.message || '사용자 목록을 불러올 수 없습니다.');
    }
  },

  /**
   * 특정 사용자 조회
   * @param {number} userId - 사용자 ID
   * @returns {Promise<Object>} 사용자 정보
   */
  async getUser(userId) {
    try {
      const response = await userAPI.getUser(userId);
      return response.data;
    } catch (error) {
      throw new Error(error.message || '사용자 정보를 불러올 수 없습니다.');
    }
  },

  /**
   * 사용자 정보 수정
   * @param {number} userId - 사용자 ID
   * @param {Object} userData - 수정할 사용자 데이터
   * @param {string} [userData.name] - 사용자 이름
   * @param {string} [userData.user_id] - 사용자 ID
   * @param {string} [userData.password] - 새 비밀번호
   * @param {string} [userData.password_confirm] - 비밀번호 확인
   * @returns {Promise<Object>} 수정된 사용자 정보
   */
  async updateUser(userId, userData) {
    try {
      // 빈 값들 제거
      const filteredData = Object.entries(userData).reduce((acc, [key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await userAPI.updateUser(userId, filteredData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || '사용자 정보 수정에 실패했습니다.');
    }
  },

  /**
   * 사용자 삭제
   * @param {number} userId - 사용자 ID
   * @returns {Promise<void>}
   */
  async deleteUser(userId) {
    try {
      await userAPI.deleteUser(userId);
    } catch (error) {
      throw new Error(error.message || '사용자 삭제에 실패했습니다.');
    }
  },

  /**
   * 사용자 ID 중복 확인 (클라이언트 사이드 검증용)
   * @param {string} userIdToCheck - 확인할 사용자 ID
   * @returns {boolean} 유효성 여부
   */
  validateUserId(userIdToCheck) {
    // 영문자, 숫자, 언더스코어만 허용
    const userIdRegex = /^[a-zA-Z0-9_]+$/;
    
    if (!userIdToCheck || userIdToCheck.length < 3 || userIdToCheck.length > 50) {
      return {
        isValid: false,
        message: '사용자 ID는 3자 이상 50자 이하여야 합니다.'
      };
    }

    if (!userIdRegex.test(userIdToCheck)) {
      return {
        isValid: false,
        message: '사용자 ID는 영문자, 숫자, 언더스코어(_)만 포함할 수 있습니다.'
      };
    }

    return {
      isValid: true,
      message: '사용 가능한 사용자 ID입니다.'
    };
  },

  /**
   * 비밀번호 유효성 검사
   * @param {string} password - 비밀번호
   * @param {string} passwordConfirm - 비밀번호 확인
   * @returns {Object} 검증 결과
   */
  validatePassword(password, passwordConfirm) {
    if (!password || password.length < 8) {
      return {
        isValid: false,
        message: '비밀번호는 최소 8자 이상이어야 합니다.'
      };
    }

    if (password !== passwordConfirm) {
      return {
        isValid: false,
        message: '비밀번호가 일치하지 않습니다.'
      };
    }

    return {
      isValid: true,
      message: '사용 가능한 비밀번호입니다.'
    };
  },

  /**
   * 사용자 이름 유효성 검사
   * @param {string} name - 사용자 이름
   * @returns {Object} 검증 결과
   */
  validateName(name) {
    if (!name || name.trim().length === 0) {
      return {
        isValid: false,
        message: '사용자 이름을 입력해주세요.'
      };
    }

    if (name.length > 255) {
      return {
        isValid: false,
        message: '사용자 이름은 255자를 초과할 수 없습니다.'
      };
    }

    return {
      isValid: true,
      message: '사용 가능한 사용자 이름입니다.'
    };
  }
};

export default userService;