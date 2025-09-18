from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging
import traceback

from ..database import get_db
from ..utils.auth import get_current_user
from ..models.user import User
from ..schemas.failure_scenario import (
    FailureScenarioCreate,
    FailureScenarioUpdate,
    FailureScenarioResponse,
    FailureScenarioApply,
    SimulatorWithFailureResponse
)
from ..services.failure_scenario_service import FailureScenarioService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/failure-scenarios",
    tags=["failure-scenarios"]
)


@router.post("/", response_model=FailureScenarioResponse, status_code=status.HTTP_201_CREATED)
def create_failure_scenario(
    scenario_data: FailureScenarioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """새로운 고장 시나리오 생성"""
    try:
        logger.info(f"Creating failure scenario for user {current_user.id}")
        logger.debug(f"Scenario data: {scenario_data.dict()}")
        
        scenario = FailureScenarioService.create_scenario(
            db=db,
            scenario_data=scenario_data,
            user_id=current_user.id
        )
        
        logger.info(f"Successfully created failure scenario with ID {scenario.id}")
        return scenario
    except ValueError as e:
        logger.error(f"ValueError in create_failure_scenario: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error in create_failure_scenario: {str(e)}")
        logger.error(f"Traceback:\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"고장 시나리오 생성 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/", response_model=List[FailureScenarioResponse])
def get_my_scenarios(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """현재 사용자의 모든 고장 시나리오 조회"""
    scenarios = FailureScenarioService.get_scenarios_by_user(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )
    return scenarios


@router.get("/{scenario_id}", response_model=FailureScenarioResponse)
def get_failure_scenario(
    scenario_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """특정 고장 시나리오 조회"""
    scenario = FailureScenarioService.get_scenario(
        db=db,
        scenario_id=scenario_id,
        user_id=current_user.id
    )
    
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="고장 시나리오를 찾을 수 없습니다."
        )
    
    return scenario


@router.get("/simulator/{simulator_id}", response_model=List[FailureScenarioResponse])
def get_scenarios_by_simulator(
    simulator_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """특정 시뮬레이터의 고장 시나리오 조회"""
    try:
        scenarios = FailureScenarioService.get_scenarios_by_simulator(
            db=db,
            simulator_id=simulator_id,
            user_id=current_user.id
        )
        return scenarios
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.put("/{scenario_id}", response_model=FailureScenarioResponse)
def update_failure_scenario(
    scenario_id: int,
    scenario_data: FailureScenarioUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """고장 시나리오 업데이트"""
    scenario = FailureScenarioService.update_scenario(
        db=db,
        scenario_id=scenario_id,
        scenario_data=scenario_data,
        user_id=current_user.id
    )
    
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="고장 시나리오를 찾을 수 없습니다."
        )
    
    return scenario


@router.delete("/{scenario_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_failure_scenario(
    scenario_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """고장 시나리오 삭제"""
    try:
        success = FailureScenarioService.delete_scenario(
            db=db,
            scenario_id=scenario_id,
            user_id=current_user.id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="고장 시나리오를 찾을 수 없습니다."
            )
        
        return None
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/apply/{simulator_id}")
def apply_scenario_to_simulator(
    simulator_id: int,
    apply_request: FailureScenarioApply,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """고장 시나리오를 시뮬레이터에 적용"""
    try:
        result = FailureScenarioService.apply_scenario_to_simulator(
            db=db,
            scenario_id=apply_request.scenario_id,
            simulator_id=simulator_id,
            user_id=current_user.id
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"고장 시나리오 적용 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/release/{simulator_id}")
def release_scenario_from_simulator(
    simulator_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """시뮬레이터에서 고장 시나리오 해제"""
    try:
        result = FailureScenarioService.release_scenario_from_simulator(
            db=db,
            simulator_id=simulator_id,
            user_id=current_user.id
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"고장 시나리오 해제 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/simulator/{simulator_id}/current", response_model=SimulatorWithFailureResponse)
def get_simulator_current_response(
    simulator_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """고장 시나리오가 적용된 시뮬레이터의 현재 응답 데이터 조회"""
    try:
        response_data = FailureScenarioService.get_simulator_with_failure(
            db=db,
            simulator_id=simulator_id
        )
        return response_data
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )