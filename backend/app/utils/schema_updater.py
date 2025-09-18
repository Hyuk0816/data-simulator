"""
데이터베이스 스키마 자동 업데이트 유틸리티
Spring JPA의 ddl_auto: update와 유사한 기능 제공
"""
import logging
from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.schema import MetaData
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)


def auto_update_schema(engine: Engine, metadata: MetaData) -> None:
    """
    데이터베이스 스키마를 자동으로 업데이트합니다.
    - 새 테이블 생성
    - 기존 테이블에 누락된 컬럼 추가
    - 기존 데이터는 유지
    
    Args:
        engine: SQLAlchemy 엔진
        metadata: SQLAlchemy MetaData 객체
    """
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    # 1. 새 테이블 생성
    metadata.create_all(bind=engine)
    
    # 2. 기존 테이블의 컬럼 체크 및 추가
    with engine.begin() as conn:
        for table in metadata.sorted_tables:
            if table.name not in existing_tables:
                continue  # 새로 생성된 테이블은 스킵
                
            existing_columns = {col['name'] for col in inspector.get_columns(table.name)}
            model_columns = {col.name for col in table.columns}
            
            # 누락된 컬럼 찾기
            missing_columns = model_columns - existing_columns
            
            if missing_columns:
                logger.info(f"테이블 '{table.name}'에 누락된 컬럼 발견: {missing_columns}")
                
                for col_name in missing_columns:
                    column = table.columns[col_name]
                    try:
                        # 컬럼 타입 및 제약조건 설정
                        col_type = column.type.compile(conn.dialect)
                        nullable = "NULL" if column.nullable else "NOT NULL"
                        default = ""
                        
                        # 기본값 처리
                        if column.default is not None:
                            if hasattr(column.default, 'arg'):
                                default_value = column.default.arg
                                if isinstance(default_value, bool):
                                    default = f"DEFAULT {str(default_value).lower()}"
                                elif isinstance(default_value, str):
                                    default = f"DEFAULT '{default_value}'"
                                elif default_value is not None:
                                    default = f"DEFAULT {default_value}"
                        
                        # server_default 처리
                        if column.server_default is not None:
                            if hasattr(column.server_default, 'arg'):
                                if 'now()' in str(column.server_default.arg):
                                    default = "DEFAULT NOW()"
                                elif 'func.' not in str(column.server_default.arg):
                                    default = f"DEFAULT {column.server_default.arg}"
                        
                        # ALTER TABLE 실행
                        alter_sql = f"""
                        ALTER TABLE {table.name} 
                        ADD COLUMN IF NOT EXISTS {col_name} {col_type} {default} {nullable}
                        """
                        
                        conn.execute(text(alter_sql.strip()))
                        logger.info(f"컬럼 '{col_name}'을(를) 테이블 '{table.name}'에 추가했습니다.")
                        
                    except SQLAlchemyError as e:
                        logger.error(f"컬럼 '{col_name}' 추가 실패: {e}")
                        # 기본값 없이 재시도
                        try:
                            alter_sql = f"""
                            ALTER TABLE {table.name} 
                            ADD COLUMN IF NOT EXISTS {col_name} {col_type}
                            """
                            conn.execute(text(alter_sql.strip()))
                            logger.info(f"컬럼 '{col_name}'을(를) 기본값 없이 추가했습니다.")
                        except Exception as e2:
                            logger.error(f"컬럼 '{col_name}' 추가 완전 실패: {e2}")
    
    logger.info("스키마 업데이트 완료")


def check_schema_differences(engine: Engine, metadata: MetaData) -> dict:
    """
    현재 데이터베이스와 모델 간의 차이점을 확인합니다.
    
    Returns:
        dict: 차이점 정보
    """
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    model_tables = {table.name for table in metadata.sorted_tables}
    
    differences = {
        'missing_tables': model_tables - existing_tables,
        'extra_tables': existing_tables - model_tables,
        'missing_columns': {},
        'extra_columns': {}
    }
    
    for table in metadata.sorted_tables:
        if table.name in existing_tables:
            existing_columns = {col['name'] for col in inspector.get_columns(table.name)}
            model_columns = {col.name for col in table.columns}
            
            missing = model_columns - existing_columns
            extra = existing_columns - model_columns
            
            if missing:
                differences['missing_columns'][table.name] = list(missing)
            if extra:
                differences['extra_columns'][table.name] = list(extra)
    
    return differences