"""
CSV/Excel 파일 파싱 및 헤더 인식 유틸리티
"""
import pandas as pd
import numpy as np
from typing import Optional, List, Any
from fastapi import UploadFile, HTTPException
import io
import re


class FileParser:
    """CSV/Excel 파일 파싱 및 헤더 자동 인식 클래스"""
    
    SUPPORTED_EXTENSIONS = ['.csv', '.xlsx', '.xls']
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    @staticmethod
    def is_valid_header_row(row: pd.Series) -> bool:
        """
        헤더 행 여부를 판단하는 지능형 알고리즘
        
        판단 기준:
        1. 모든 요소가 문자열이어야 함 (숫자만 있는 것 제외)
        2. 중복된 요소가 없어야 함
        3. 빈 값이 없어야 함
        4. 특수문자나 숫자로만 이루어진 값 제외
        """
        # 리스트로 변환
        values = row.dropna().astype(str).tolist()
        
        # 빈 값이 있으면 헤더가 아님
        if len(values) != len(row) or len(values) == 0:
            return False
        
        # 중복된 값이 있으면 헤더가 아님
        if len(values) != len(set(values)):
            return False
        
        # 각 값에 대한 검증
        for value in values:
            # 빈 문자열이면 헤더가 아님
            if not value.strip():
                return False
            
            # 순수 숫자만 있으면 헤더가 아님
            if value.strip().replace('.', '').replace('-', '').isdigit():
                return False
            
            # 특수문자만 있으면 헤더가 아님
            if not re.search(r'[a-zA-Z가-힣]', value):
                return False
        
        return True
    
    @staticmethod
    def detect_header_row(df: pd.DataFrame, max_rows: int = 10) -> Optional[int]:
        """
        데이터프레임에서 헤더 행을 자동으로 감지
        
        Args:
            df: 파싱할 데이터프레임
            max_rows: 헤더를 찾기 위해 검사할 최대 행 수
            
        Returns:
            헤더 행의 인덱스 (0-based), 없으면 None
        """
        # 최대 검사 행 수만큼 순회
        for i in range(min(max_rows, len(df))):
            row = df.iloc[i]
            
            # 현재 행이 헤더 조건을 만족하는지 확인
            if FileParser.is_valid_header_row(row):
                # 다음 행이 데이터 행인지 추가 검증 (있다면)
                if i + 1 < len(df):
                    next_row = df.iloc[i + 1]
                    # 다음 행에 숫자 데이터가 있으면 현재 행이 헤더일 가능성 높음
                    numeric_count = sum(1 for val in next_row if pd.notna(val) and 
                                      str(val).replace('.', '').replace('-', '').isdigit())
                    if numeric_count > len(next_row) / 2:
                        return i
                else:
                    # 마지막 행이면서 헤더 조건을 만족하면 헤더로 인정
                    return i
        
        return None
    
    @staticmethod
    def infer_data_types(series: pd.Series) -> str:
        """
        데이터 시리즈의 타입을 추론
        
        Returns:
            'number', 'boolean', 'string' 중 하나
        """
        # null이 아닌 값들만 추출
        non_null_values = series.dropna()
        
        if len(non_null_values) == 0:
            return 'string'
        
        # 불린 타입 체크
        bool_values = {'true', 'false', 'yes', 'no', '1', '0', 'y', 'n'}
        if all(str(val).lower() in bool_values for val in non_null_values):
            return 'boolean'
        
        # 숫자 타입 체크
        try:
            pd.to_numeric(non_null_values)
            return 'number'
        except:
            return 'string'
    
    @staticmethod
    def convert_value(value: Any, data_type: str) -> Any:
        """
        값을 적절한 타입으로 변환
        """
        if pd.isna(value):
            return ""
        
        if data_type == 'number':
            try:
                # 정수인지 실수인지 확인
                num_val = float(value)
                if num_val.is_integer():
                    return int(num_val)
                return round(num_val, 2)
            except:
                return str(value)
        
        elif data_type == 'boolean':
            str_val = str(value).lower()
            if str_val in ['true', 'yes', '1', 'y']:
                return True
            elif str_val in ['false', 'no', '0', 'n']:
                return False
            return str(value)
        
        else:  # string
            return str(value)
    
    @staticmethod
    async def parse_file(file: UploadFile) -> List[str]:
        """
        업로드된 파일을 파싱하여 컬럼명(파라미터 키) 리스트 반환
        
        Args:
            file: 업로드된 파일 객체
            
        Returns:
            컬럼명 리스트 (예: ["water_qty", "saving", "depth_data"])
        """
        # 파일 확장자 검증
        filename = file.filename.lower()
        if not any(filename.endswith(ext) for ext in FileParser.SUPPORTED_EXTENSIONS):
            raise HTTPException(
                status_code=400,
                detail=f"지원되지 않는 파일 형식입니다. 지원 형식: {', '.join(FileParser.SUPPORTED_EXTENSIONS)}"
            )
        
        # 파일 크기 검증
        contents = await file.read()
        if len(contents) > FileParser.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"파일 크기가 너무 큽니다. 최대 크기: {FileParser.MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        try:
            # 파일 내용을 메모리에서 읽기
            file_buffer = io.BytesIO(contents)
            
            # 파일 형식에 따라 파싱
            if filename.endswith('.csv'):
                # CSV 파일 읽기 (인코딩 자동 감지 시도)
                try:
                    df = pd.read_csv(file_buffer, encoding='utf-8', header=None)
                except UnicodeDecodeError:
                    file_buffer.seek(0)
                    df = pd.read_csv(file_buffer, encoding='cp949', header=None)
            else:
                # Excel 파일 읽기
                df = pd.read_excel(file_buffer, header=None)
            
            if df.empty:
                raise HTTPException(
                    status_code=400,
                    detail="파일이 비어있습니다."
                )
            
            # 헤더 행 자동 감지
            header_row_idx = FileParser.detect_header_row(df)
            
            if header_row_idx is None:
                # 헤더를 찾을 수 없으면 첫 번째 행을 헤더로 사용
                headers = [f"column_{i+1}" for i in range(len(df.columns))]
                data_start_idx = 0
                message = "헤더를 자동으로 인식할 수 없어 기본 컬럼명을 사용합니다."
            else:
                # 헤더 행 추출
                headers = df.iloc[header_row_idx].astype(str).tolist()
                data_start_idx = header_row_idx + 1
                message = f"{header_row_idx + 1}번째 행을 헤더로 인식했습니다."
            
            # 컬럼명(헤더) 리스트만 반환
            return headers
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"파일 파싱 중 오류가 발생했습니다: {str(e)}"
            )