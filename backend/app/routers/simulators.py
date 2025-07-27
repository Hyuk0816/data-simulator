"""
시뮬레이터 관련 API 라우터 - CRUD 및 동적 API 엔드포인트
"""
import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Path, Query, UploadFile, File
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.simulator import (
    SimulatorCreate,
    SimulatorUpdate,
    SimulatorResponse,
    SimulatorDataResponse,
    SimulatorInactiveResponse
)
from ..services.simulator_service import SimulatorService
from ..models.user import User
from ..utils.auth import get_current_user
from ..utils.file_parser import FileParser


router = APIRouter(
    prefix="/api/simulators",
    tags=["시뮬레이터"],
    responses={404: {"description": "Not found"}}
)


@router.post("/", response_model=SimulatorResponse, status_code=status.HTTP_201_CREATED, summary="시뮬레이터 생성")
async def create_simulator(
    simulator_create: SimulatorCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    새 시뮬레이터를 생성합니다.
    
    - **name**: 시뮬레이터 이름 (영문자, 숫자, 언더스코어, 하이픈만 허용)
    - **parameters**: JSON 형태의 키-값 파라미터
    - **is_active**: 활성화 상태 (기본값: true)
    
    생성된 시뮬레이터는 `/api/data/{user_id}-{name}` 엔드포인트로 접근 가능합니다.
    """
    try:
        new_simulator = SimulatorService.create_simulator(
            db, current_user.id, simulator_create
        )
        
        return SimulatorService.prepare_simulator_response(new_simulator)
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="시뮬레이터 생성 중 오류가 발생했습니다"
        )


@router.get("/", response_model=List[SimulatorResponse], summary="내 시뮬레이터 목록 조회")
async def list_my_simulators(
    skip: int = Query(0, ge=0, description="건너뛸 항목 수"),
    limit: int = Query(100, ge=1, le=100, description="조회할 항목 수"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    현재 로그인한 사용자의 시뮬레이터 목록을 조회합니다.
    
    페이지네이션을 지원합니다:
    - **skip**: 건너뛸 항목 수 (기본값: 0)
    - **limit**: 조회할 항목 수 (기본값: 100, 최대: 100)
    """
    simulators = SimulatorService.get_simulators_by_user(
        db, current_user.id, skip=skip, limit=limit
    )
    
    return [SimulatorService.prepare_simulator_response(sim) for sim in simulators]


@router.get("/{simulator_id}", response_model=SimulatorResponse, summary="시뮬레이터 상세 조회")
async def get_simulator(
    simulator_id: int = Path(..., description="시뮬레이터 ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    특정 시뮬레이터의 상세 정보를 조회합니다.
    
    본인이 소유한 시뮬레이터만 조회 가능합니다.
    """
    simulator = SimulatorService.get_simulator_by_id(db, simulator_id)
    
    if not simulator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="시뮬레이터를 찾을 수 없습니다"
        )
    
    if simulator.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="해당 시뮬레이터에 접근할 권한이 없습니다"
        )
    
    return SimulatorService.prepare_simulator_response(simulator)


@router.put("/{simulator_id}", response_model=SimulatorResponse, summary="시뮬레이터 수정")
async def update_simulator(
    simulator_id: int = Path(..., description="시뮬레이터 ID"),
    simulator_update: SimulatorUpdate = ...,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    시뮬레이터 정보를 수정합니다.
    
    - **name**: 새로운 시뮬레이터 이름 (선택사항)
    - **parameters**: 새로운 파라미터 (선택사항)
    - **is_active**: 활성화 상태 (선택사항)
    
    본인이 소유한 시뮬레이터만 수정 가능합니다.
    """
    try:
        updated_simulator = SimulatorService.update_simulator(
            db, simulator_id, current_user.id, simulator_update
        )
        
        if not updated_simulator:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="시뮬레이터를 찾을 수 없습니다"
            )
        
        return SimulatorService.prepare_simulator_response(updated_simulator)
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="시뮬레이터 수정 중 오류가 발생했습니다"
        )


@router.delete("/{simulator_id}", status_code=status.HTTP_204_NO_CONTENT, summary="시뮬레이터 삭제")
async def delete_simulator(
    simulator_id: int = Path(..., description="시뮬레이터 ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    시뮬레이터를 삭제합니다.
    
    본인이 소유한 시뮬레이터만 삭제 가능합니다.
    """
    try:
        success = SimulatorService.delete_simulator(
            db, simulator_id, current_user.id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="시뮬레이터를 찾을 수 없습니다"
            )
        
        return None  # 204 No Content
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="시뮬레이터 삭제 중 오류가 발생했습니다"
        )


@router.patch("/{simulator_id}/toggle", response_model=SimulatorResponse, summary="시뮬레이터 활성화 상태 토글")
async def toggle_simulator_status(
    simulator_id: int = Path(..., description="시뮬레이터 ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    시뮬레이터의 활성화 상태를 토글합니다.
    
    활성화 → 비활성화, 비활성화 → 활성화로 전환됩니다.
    """
    try:
        toggled_simulator = SimulatorService.toggle_simulator_status(
            db, simulator_id, current_user.id
        )
        
        if not toggled_simulator:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="시뮬레이터를 찾을 수 없습니다"
            )
        
        return SimulatorService.prepare_simulator_response(toggled_simulator)
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="시뮬레이터 상태 변경 중 오류가 발생했습니다"
        )


@router.post("/upload", response_model=List[str], summary="CSV/Excel 파일 업로드 및 컬럼명 추출")
async def upload_file_for_parameters(
    file: UploadFile = File(..., description="CSV 또는 Excel 파일"),
    current_user: User = Depends(get_current_user)
) -> List[str]:
    """
    CSV/Excel 파일을 업로드하여 컬럼명(파라미터 키)을 추출합니다.
    
    - 지원 형식: .csv, .xlsx, .xls
    - 최대 파일 크기: 10MB
    - 첫 번째 행을 헤더로 자동 인식 (지능형 알고리즘 사용)
    
    **헤더 인식 알고리즘:**
    - 모든 요소가 문자열이어야 함 (순수 숫자 제외)
    - 중복된 요소가 없어야 함
    - 빈 값이 없어야 함
    - 영문자 또는 한글이 포함되어야 함
    
    **응답 예시:**
    ```json
    ["water_qty", "saving", "depth_data"]
    ```
    """
    try:
        headers = await FileParser.parse_file(file)
        return headers
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"파일 업로드 처리 중 오류: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="파일 처리 중 예상치 못한 오류가 발생했습니다"
        )


# 동적 API 엔드포인트 라우터
data_router = APIRouter(
    prefix="/api/data",
    tags=["데이터 API"],
    responses={404: {"description": "Not found"}}
)


@data_router.get("/{user_id}/{simulator_name}", summary="시뮬레이터 데이터 조회")
async def get_simulator_data(
    user_id: str = Path(..., description="사용자 ID"),
    simulator_name: str = Path(..., description="시뮬레이터 이름"),
    db: Session = Depends(get_db)
):
    """
    시뮬레이터의 설정된 파라미터 데이터를 반환합니다.
    
    - 활성화된 시뮬레이터: 설정된 JSON 파라미터만 반환 (메타데이터 없음)
    - 비활성화된 시뮬레이터: 비활성화 메시지를 반환
    
    인증 없이 공개적으로 접근 가능한 엔드포인트입니다.
    
    예시: /api/data/rlawogur816/ocean-data-simulator
    응답 예시 (활성화): {"depth_data": 25, "water_quality": 30, "tool": "test"}
    응답 예시 (비활성화): {"message": "해당 시뮬레이터는 비활성화 상태 입니다."}
    """
    try:
        result = SimulatorService.get_simulator_data(db, user_id, simulator_name)
        
        # type 정보 없이 data만 직접 반환
        return result["data"]
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="데이터 조회 중 오류가 발생했습니다"
        )