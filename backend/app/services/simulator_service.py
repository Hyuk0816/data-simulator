"""
시뮬레이터 서비스 - 시뮬레이터 CRUD 및 동적 API 관리 비즈니스 로직
"""
import logging
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import select, and_
import json
from datetime import datetime

from ..models.simulator import Simulator
from ..models.user import User
from ..schemas.simulator import (
    SimulatorCreate, 
    SimulatorUpdate, 
    SimulatorResponse,
    SimulatorDataResponse,
    SimulatorInactiveResponse
)


class SimulatorService:
    """시뮬레이터 관련 비즈니스 로직을 처리하는 서비스 클래스"""
    
    @staticmethod
    def create_simulator(db: Session, user_id: int, simulator_create: SimulatorCreate) -> Simulator:
        """새 시뮬레이터 생성"""
        # 같은 사용자의 동일한 이름 시뮬레이터 중복 검사
        existing_simulator = SimulatorService.get_simulator_by_name_and_user(
            db, str(user_id), simulator_create.name
        )
        if existing_simulator:
            raise ValueError(f"이미 '{simulator_create.name}' 이름의 시뮬레이터가 존재합니다.")
        
        # 파라미터를 JSON 문자열로 변환
        parameters_json = json.dumps(simulator_create.parameters, ensure_ascii=False)
        
        # 시뮬레이터 생성
        db_simulator = Simulator(
            user_id=user_id,
            name=simulator_create.name,
            parameters=parameters_json,
            is_active=simulator_create.is_active
        )
        
        db.add(db_simulator)
        db.commit()
        db.refresh(db_simulator)
        return db_simulator
    
    @staticmethod
    def get_simulator_by_id(db: Session, simulator_id: int) -> Optional[Simulator]:
        """ID로 시뮬레이터 조회"""
        return db.get(Simulator, simulator_id)
    
    @staticmethod
    def get_simulator_by_name_and_user(db: Session, user_id: str, name: str) -> Optional[Simulator]:
        """사용자 ID와 시뮬레이터 이름으로 조회
        
        Args:
            user_id: 사용자 ID 문자열 (User.user_id 값)
            name: 시뮬레이터 이름
        """
        # 만약 user_id가 숫자로 변환 가능하면 정수형 ID로 처리 (legacy support)
        try:
            user_id_int = int(user_id)
            # 정수형 ID로 직접 조회
            stmt = select(Simulator).where(
                and_(Simulator.user_id == user_id_int, Simulator.name == name)
            )
            simulator = db.scalar(stmt)
            if simulator:
                return simulator
        except ValueError:
            pass
        
        # user_id(문자열)로 User 조회
        stmt_user = select(User).where(User.user_id == user_id)
        user = db.scalar(stmt_user)
        
        if not user:
            return None
            
        # 디버깅용 로그
        logging.info(f"User ID(str): {user_id}, User.id(int): {user.id}, Simulator Name: {name}")
        
        # User의 id(정수)와 시뮬레이터 이름으로 조회
        stmt = select(Simulator).where(
            and_(Simulator.user_id == user.id, Simulator.name == name)
        )
        return db.scalar(stmt)
    
    @staticmethod
    def get_simulators_by_user(db: Session, user_id: int, 
                             skip: int = 0, limit: int = 100) -> List[Simulator]:
        """특정 사용자의 모든 시뮬레이터 조회"""
        stmt = select(Simulator).where(
            Simulator.user_id == user_id
        ).offset(skip).limit(limit).order_by(Simulator.created_at.desc())
        
        return list(db.scalars(stmt).all())
    
    @staticmethod
    def update_simulator(db: Session, simulator_id: int, 
                        user_id: int, simulator_update: SimulatorUpdate) -> Optional[Simulator]:
        """시뮬레이터 정보 업데이트"""
        # 시뮬레이터 조회 및 소유권 확인
        db_simulator = SimulatorService.get_simulator_by_id(db, simulator_id)
        if not db_simulator:
            return None
        
        if db_simulator.user_id != user_id:
            raise ValueError("해당 시뮬레이터를 수정할 권한이 없습니다.")
        
        # 업데이트할 필드만 처리
        update_data = simulator_update.model_dump(exclude_unset=True)
        
        # 이름 변경 시 중복 검사
        if "name" in update_data and update_data["name"]:
            new_name = update_data["name"]
            if new_name != db_simulator.name:
                existing_simulator = SimulatorService.get_simulator_by_name_and_user(
                    db, str(user_id), new_name
                )
                if existing_simulator:
                    raise ValueError(f"이미 '{new_name}' 이름의 시뮬레이터가 존재합니다.")
        
        # 파라미터 업데이트 시 JSON 문자열로 변환
        if "parameters" in update_data and update_data["parameters"] is not None:
            update_data["parameters"] = json.dumps(update_data["parameters"], ensure_ascii=False)
        
        # 업데이트 적용
        for field, value in update_data.items():
            setattr(db_simulator, field, value)
        
        db.commit()
        db.refresh(db_simulator)
        return db_simulator
    
    @staticmethod
    def delete_simulator(db: Session, simulator_id: int, user_id: int) -> bool:
        """시뮬레이터 삭제"""
        # 시뮬레이터 조회 및 소유권 확인
        db_simulator = SimulatorService.get_simulator_by_id(db, simulator_id)
        if not db_simulator:
            return False
        
        if db_simulator.user_id != user_id:
            raise ValueError("해당 시뮬레이터를 삭제할 권한이 없습니다.")
        
        db.delete(db_simulator)
        db.commit()
        return True
    
    @staticmethod
    def get_simulator_data(db: Session, user_id_str: str, simulator_name: str) -> Dict[str, Any]:
        """
        동적 API 엔드포인트를 위한 시뮬레이터 데이터 조회
        
        Args:
            db: 데이터베이스 세션
            user_id_str: URL에서 전달된 사용자 ID 문자열
            simulator_name: URL에서 전달된 시뮬레이터 이름
            
        Returns:
            시뮬레이터 데이터 또는 비활성화 메시지
        """
        # 사용자 조회
        logging.info(user_id_str)
        logging.info(simulator_name)
        stmt_user = select(User).where(User.user_id == user_id_str.lower())
        user = db.scalar(stmt_user)
        
        if not user:
            raise ValueError(f"사용자 '{user_id_str}'를 찾을 수 없습니다.")
        
        # 시뮬레이터 조회 - user_id_str(문자열)을 전달
        simulator = SimulatorService.get_simulator_by_name_and_user(
            db, user_id_str, simulator_name
        )
        
        if not simulator:
            raise ValueError(f"시뮬레이터 '{simulator_name}'를 찾을 수 없습니다.")
        
        # 활성화 상태 확인
        if not simulator.is_active:
            # 비활성화 상태 응답
            return {
                "type": "inactive",
                "data": SimulatorInactiveResponse(
                    simulator_name=simulator_name,
                    user_id=user_id_str
                ).model_dump()
            }
        
        # 활성화 상태 - 파라미터 데이터 반환
        try:
            parameters = json.loads(simulator.parameters)
        except json.JSONDecodeError:
            raise ValueError("시뮬레이터 파라미터 파싱 오류가 발생했습니다.")
        
        return {
            "type": "active",
            "data": SimulatorDataResponse(
                data=parameters,
                simulator_name=simulator_name,
                user_id=user_id_str
            ).model_dump()
        }
    
    @staticmethod
    def toggle_simulator_status(db: Session, simulator_id: int, user_id: int) -> Optional[Simulator]:
        """시뮬레이터 활성화/비활성화 토글"""
        # 시뮬레이터 조회 및 소유권 확인
        db_simulator = SimulatorService.get_simulator_by_id(db, simulator_id)
        if not db_simulator:
            return None
        
        if db_simulator.user_id != user_id:
            raise ValueError("해당 시뮬레이터를 수정할 권한이 없습니다.")
        
        # 상태 토글
        db_simulator.is_active = not db_simulator.is_active
        
        db.commit()
        db.refresh(db_simulator)
        return db_simulator
    
    @staticmethod
    def count_user_simulators(db: Session, user_id: int) -> int:
        """사용자의 시뮬레이터 총 개수 조회"""
        return db.query(Simulator).filter(Simulator.user_id == user_id).count()
    
    @staticmethod
    def prepare_simulator_response(simulator: Simulator) -> Dict[str, Any]:
        """시뮬레이터 엔티티를 응답 형식으로 변환"""
        try:
            parameters = json.loads(simulator.parameters)
        except json.JSONDecodeError:
            parameters = {}
        
        return {
            "id": simulator.id,
            "user_id": simulator.user_id,
            "name": simulator.name,
            "parameters": parameters,
            "is_active": simulator.is_active,
            "created_at": simulator.created_at,
            "updated_at": simulator.updated_at
        }