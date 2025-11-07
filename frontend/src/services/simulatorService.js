import { simulatorAPI } from './api';

/**
 * 시뮬레이터 서비스 레이어
 * 비즈니스 로직과 에러 처리를 담당
 */
class SimulatorService {
    /**
     * 시뮬레이터 생성
     * @param {Object} simulatorData - 시뮬레이터 데이터
     * @param {string} simulatorData.name - 시뮬레이터 이름
     * @param {Object} simulatorData.parameters - 키-값 파라미터
     * @param {boolean} simulatorData.is_active - 활성화 상태
     * @returns {Promise<Object>} 생성된 시뮬레이터 정보
     */
    async createSimulator(simulatorData) {
        try {
            // 입력 검증
            this.validateSimulatorData(simulatorData);
            
            const response = await simulatorAPI.createSimulator(simulatorData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * 시뮬레이터 목록 조회
     * @param {number} skip - 건너뛸 항목 수
     * @param {number} limit - 조회할 항목 수
     * @returns {Promise<Array>} 시뮬레이터 목록
     */
    async getSimulators(skip = 0, limit = 100) {
        try {
            const response = await simulatorAPI.getSimulators(skip, limit);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * 특정 시뮬레이터 조회
     * @param {number} id - 시뮬레이터 ID
     * @returns {Promise<Object>} 시뮬레이터 정보
     */
    async getSimulator(id) {
        try {
            const response = await simulatorAPI.getSimulator(id);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * 시뮬레이터 업데이트
     * @param {number} id - 시뮬레이터 ID
     * @param {Object} updateData - 업데이트 데이터
     * @returns {Promise<Object>} 업데이트된 시뮬레이터 정보
     */
    async updateSimulator(id, updateData) {
        try {
            // 업데이트 데이터 검증
            if (updateData.name !== undefined || updateData.parameters !== undefined) {
                this.validateSimulatorData(updateData, true);
            }
            
            const response = await simulatorAPI.updateSimulator(id, updateData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * 시뮬레이터 삭제
     * @param {number} id - 시뮬레이터 ID
     * @returns {Promise<void>}
     */
    async deleteSimulator(id) {
        try {
            await simulatorAPI.deleteSimulator(id);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * 시뮬레이터 활성화 상태 토글
     * @param {number} id - 시뮬레이터 ID
     * @returns {Promise<Object>} 업데이트된 시뮬레이터 정보
     */
    async toggleSimulator(id) {
        try {
            const response = await simulatorAPI.toggleSimulator(id);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * 시뮬레이터 데이터 조회 (공개 API)
     * @param {string} userId - 사용자 ID
     * @param {string} simulatorName - 시뮬레이터 이름
     * @returns {Promise<Object>} 시뮬레이터 데이터
     */
    async getSimulatorData(userId, simulatorName) {
        try {
            const response = await simulatorAPI.getSimulatorData(userId, simulatorName);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * 시뮬레이터 데이터 검증
     * @param {Object} data - 검증할 데이터
     * @param {boolean} isUpdate - 업데이트 모드 여부
     */
    validateSimulatorData(data, isUpdate = false) {
        const errors = [];

        // 이름 검증
        if (!isUpdate || data.name !== undefined) {
            if (!isUpdate && !data.name) {
                errors.push('시뮬레이터 이름은 필수입니다.');
            } else if (data.name) {
                if (data.name.length < 1 || data.name.length > 255) {
                    errors.push('시뮬레이터 이름은 1자 이상 255자 이하여야 합니다.');
                }
                if (!/^[a-zA-Z0-9-]+$/.test(data.name)) {
                    errors.push('시뮬레이터 이름은 영문자, 숫자, 하이픈(-)만 사용할 수 있습니다.');
                }
            }
        }

        // 파라미터 검증
        if (!isUpdate || data.parameters !== undefined) {
            if (!isUpdate && !data.parameters) {
                errors.push('파라미터는 필수입니다.');
            } else if (data.parameters) {
                if (typeof data.parameters !== 'object' || Array.isArray(data.parameters)) {
                    errors.push('파라미터는 객체 형태여야 합니다.');
                } else if (Object.keys(data.parameters).length === 0) {
                    errors.push('파라미터는 비어있을 수 없습니다.');
                } else {
                    // 파라미터 키 검증
                    for (const key of Object.keys(data.parameters)) {
                        if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
                            errors.push(`파라미터 키 "${key}"는 영문자로 시작하고 영문자, 숫자, 언더스코어(_)만 사용할 수 있습니다.`);
                        }
                    }
                }
            }
        }

        if (errors.length > 0) {
            throw new Error(errors.join(' '));
        }
    }

    /**
     * 에러 처리
     * @param {Error} error - 에러 객체
     * @returns {Error} 처리된 에러
     */
    handleError(error) {
        // API 에러 메시지 추출
        const message = error.message || error.data?.detail || '시뮬레이터 작업 중 오류가 발생했습니다.';
        
        // 상태 코드별 메시지 처리
        if (error.status === 400) {
            return new Error(`잘못된 요청: ${message}`);
        } else if (error.status === 403) {
            return new Error('해당 시뮬레이터에 접근할 권한이 없습니다.');
        } else if (error.status === 404) {
            return new Error('시뮬레이터를 찾을 수 없습니다.');
        } else if (error.status === 409) {
            return new Error('이미 동일한 이름의 시뮬레이터가 존재합니다.');
        }
        
        return new Error(message);
    }

    /**
     * 사용자 정보를 사용하여 시뮬레이터 API 엔드포인트 생성
     * @param {string} userId - 사용자 ID
     * @param {string} simulatorName - 시뮬레이터 이름
     * @returns {string} API 엔드포인트 URL
     */
    getSimulatorEndpoint(userId, simulatorName) {
        const baseUrl = window.location.origin.includes('localhost') 
            ? (process.env.REACT_APP_API_URL || 'http://localhost:5555')
            : window.location.origin;
        return `${baseUrl}/api/data/${userId}/${simulatorName}`;
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
export default new SimulatorService();