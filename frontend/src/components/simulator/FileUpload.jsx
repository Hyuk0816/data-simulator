import React, { useState, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    CircularProgress,
    Alert,
    Chip,
    IconButton,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ClearIcon from '@mui/icons-material/Clear';
import { useTheme } from '@mui/material/styles';

const FileUpload = ({ onFileUpload, onClear }) => {
    const theme = useTheme();
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        
        const file = e.dataTransfer.files[0];
        handleFile(file);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        handleFile(file);
    };

    const handleFile = (file) => {
        setError(null);
        
        if (!file) return;

        // 파일 확장자 검증
        const validExtensions = ['.csv', '.xlsx', '.xls'];
        const fileName = file.name.toLowerCase();
        const isValidFile = validExtensions.some(ext => fileName.endsWith(ext));

        if (!isValidFile) {
            setError('지원되지 않는 파일 형식입니다. CSV 또는 Excel 파일만 업로드 가능합니다.');
            return;
        }

        // 파일 크기 검증 (10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('파일 크기가 너무 큽니다. 최대 10MB까지 업로드 가능합니다.');
            return;
        }

        setSelectedFile(file);
        uploadFile(file);
    };

    const uploadFile = async (file) => {
        setIsUploading(true);
        try {
            await onFileUpload(file);
        } catch (err) {
            setError(err.message || '파일 업로드 중 오류가 발생했습니다.');
            setSelectedFile(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleClear = () => {
        setSelectedFile(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onClear();
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <Box>
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            {!selectedFile ? (
                <Paper
                    onClick={handleClick}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    sx={{
                        border: '2px dashed',
                        borderColor: isDragging ? 'primary.main' : 'divider',
                        borderRadius: 2,
                        p: 4,
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: isDragging 
                            ? theme.palette.action.hover 
                            : theme.palette.background.paper,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            borderColor: 'primary.main',
                            backgroundColor: theme.palette.action.hover,
                        },
                    }}
                >
                    <CloudUploadIcon 
                        sx={{ 
                            fontSize: 48, 
                            color: isDragging ? 'primary.main' : 'text.secondary',
                            mb: 2,
                        }} 
                    />
                    <Typography variant="h6" gutterBottom>
                        CSV/Excel 파일을 드래그하거나 클릭하여 업로드
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        지원 형식: .csv, .xlsx, .xls (최대 10MB)
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<CloudUploadIcon />}
                        sx={{ mt: 2 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClick();
                        }}
                    >
                        파일 선택
                    </Button>
                </Paper>
            ) : (
                <Paper
                    sx={{
                        p: 3,
                        borderRadius: 2,
                        backgroundColor: theme.palette.mode === 'dark'
                            ? theme.palette.grey[900]
                            : theme.palette.grey[50],
                    }}
                >
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={2}>
                            <InsertDriveFileIcon color="primary" sx={{ fontSize: 40 }} />
                            <Box>
                                <Typography variant="subtitle1" fontWeight="medium">
                                    {selectedFile.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {(selectedFile.size / 1024).toFixed(2)} KB
                                </Typography>
                            </Box>
                        </Box>
                        {isUploading ? (
                            <CircularProgress size={24} />
                        ) : (
                            <IconButton onClick={handleClear} size="small">
                                <ClearIcon />
                            </IconButton>
                        )}
                    </Box>
                    {isUploading && (
                        <Box mt={2}>
                            <Typography variant="body2" color="primary" gutterBottom>
                                파일을 분석하고 있습니다...
                            </Typography>
                        </Box>
                    )}
                </Paper>
            )}

            {error && (
                <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Box mt={2}>
                <Typography variant="caption" color="text.secondary">
                    * 첫 번째 행은 자동으로 헤더(컬럼명)로 인식됩니다.
                </Typography>
            </Box>
        </Box>
    );
};

export default FileUpload;