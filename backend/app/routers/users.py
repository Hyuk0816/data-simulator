"""
사용자 관리 API 라우터 - 사용자 정보 조회, 수정, 삭제
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.user import UserResponse, UserUpdate
from ..services.user_service import UserService
from ..utils.auth import get_current_user
from ..models.user import User


router = APIRouter(
    prefix="/api/users",
    tags=["사용자"],
    responses={404: {"description": "Not found"}}
)


@router.get("/", response_model=List[UserResponse], summary="전체 사용자 목록")
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    전체 사용자 목록을 조회합니다.
    
    - **skip**: 건너뛸 레코드 수 (기본값: 0)
    - **limit**: 최대 조회 레코드 수 (기본값: 100)
    
    관리자 권한이 필요할 수 있습니다.
    """
    # 현재는 모든 인증된 사용자가 목록을 볼 수 있도록 구현
    # 추후 관리자 권한 체크 추가 가능
    users = db.query(User).offset(skip).limit(limit).all()
    
    return [
        UserResponse(
            id=user.id,
            name=user.name,
            user_id=user.user_id,
            created_at=user.created_at,
            updated_at=user.updated_at
        ) for user in users
    ]


@router.get("/{user_id}", response_model=UserResponse, summary="특정 사용자 조회")
async def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    특정 사용자의 정보를 조회합니다.
    
    - **user_id**: 조회할 사용자의 ID (PK)
    """
    user = UserService.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다"
        )
    
    return UserResponse(
        id=user.id,
        name=user.name,
        user_id=user.user_id,
        created_at=user.created_at,
        updated_at=user.updated_at
    )


@router.put("/{user_id}", response_model=UserResponse, summary="사용자 정보 수정")
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    사용자 정보를 수정합니다.
    
    - **user_id**: 수정할 사용자의 ID (PK)
    - 본인의 정보만 수정 가능합니다.
    """
    # 본인 확인
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="다른 사용자의 정보는 수정할 수 없습니다"
        )
    
    try:
        updated_user = UserService.update_user(db, user_id, user_update)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자를 찾을 수 없습니다"
            )
        
        return UserResponse(
            id=updated_user.id,
            name=updated_user.name,
            user_id=updated_user.user_id,
            created_at=updated_user.created_at,
            updated_at=updated_user.updated_at
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, summary="사용자 삭제")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    사용자를 삭제합니다.
    
    - **user_id**: 삭제할 사용자의 ID (PK)
    - 본인의 계정만 삭제 가능합니다.
    """
    # 본인 확인
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="다른 사용자의 계정은 삭제할 수 없습니다"
        )
    
    if not UserService.delete_user(db, user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다"
        )
    
    # 204 No Content 응답 (반환값 없음)