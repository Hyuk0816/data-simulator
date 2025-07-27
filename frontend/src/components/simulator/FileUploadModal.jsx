import React, { useState, useRef, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    Button,
    CircularProgress,
    Alert,
    Chip,
    IconButton,
    Paper,
    List,
    ListItem,
    ListItemText,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTheme } from '@mui/material/styles';

const FileUploadModal = ({ open, onClose, onFileUpload }) => {
    const theme = useTheme();
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const [extractedColumns, setExtractedColumns] = useState([]);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    // Reset all state when modal is closed
    useEffect(() => {
        if (!open) {
            // Reset all state
            setSelectedFile(null);
            setError(null);
            setExtractedColumns([]);
            setUploadSuccess(false);
            setIsDragging(false);
            
            // Clear file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [open]);

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
        // Reset state before processing new file
        setError(null);
        setExtractedColumns([]);
        setUploadSuccess(false);
        setSelectedFile(null);
        
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
            const columns = await onFileUpload(file);
            setExtractedColumns(columns);
            setUploadSuccess(true);
        } catch (err) {
            setError(err.message || '파일 업로드 중 오류가 발생했습니다.');
            setSelectedFile(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleApply = () => {
        if (extractedColumns.length > 0) {
            onClose(extractedColumns);
        }
    };

    const handleClose = () => {
        // State reset is handled by useEffect
        onClose();
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6">CSV/Excel 파일에서 파라미터 가져오기</Typography>
                    <IconButton 
                        edge="end" 
                        color="inherit" 
                        onClick={handleClose}
                        aria-label="close"
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            
            <DialogContent dividers>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />

                {!selectedFile && !uploadSuccess && (
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
                                : theme.palette.background.default,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                borderColor: 'primary.main',
                                backgroundColor: theme.palette.action.hover,
                            },
                        }}
                    >
                        <CloudUploadIcon 
                            sx={{ 
                                fontSize: 64, 
                                color: isDragging ? 'primary.main' : 'text.secondary',
                                mb: 2,
                            }} 
                        />
                        <Typography variant="h6" gutterBottom>
                            파일을 드래그하거나 클릭하여 업로드
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
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
                )}

                {selectedFile && !uploadSuccess && (
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 2,
                            backgroundColor: theme.palette.mode === 'dark'
                                ? theme.palette.grey[900]
                                : theme.palette.grey[50],
                        }}
                    >
                        <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column">
                            <InsertDriveFileIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                                {selectedFile.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {(selectedFile.size / 1024).toFixed(2)} KB
                            </Typography>
                            {isUploading && (
                                <Box mt={2} display="flex" alignItems="center" gap={1}>
                                    <CircularProgress size={20} />
                                    <Typography variant="body2" color="primary">
                                        파일을 분석하고 있습니다...
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                )}

                {uploadSuccess && extractedColumns.length > 0 && (
                    <Box>
                        <Paper
                            sx={{
                                p: 3,
                                borderRadius: 2,
                                backgroundColor: theme.palette.success.light,
                                color: theme.palette.success.contrastText,
                                mb: 3,
                            }}
                        >
                            <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                <CheckCircleIcon />
                                <Typography variant="subtitle1">
                                    {extractedColumns.length}개의 파라미터를 성공적으로 추출했습니다!
                                </Typography>
                            </Box>
                        </Paper>

                        <Box display="flex" justifyContent="center" mb={2}>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                    setSelectedFile(null);
                                    setError(null);
                                    setExtractedColumns([]);
                                    setUploadSuccess(false);
                                    if (fileInputRef.current) {
                                        fileInputRef.current.value = '';
                                    }
                                }}
                            >
                                다른 파일 업로드
                            </Button>
                        </Box>

                        <Typography variant="subtitle2" gutterBottom>
                            추출된 파라미터:
                        </Typography>
                        <Box sx={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: 1, 
                            mt: 1,
                            p: 2,
                            backgroundColor: theme.palette.mode === 'dark'
                                ? theme.palette.grey[900]
                                : theme.palette.grey[50],
                            borderRadius: 1,
                        }}>
                            {extractedColumns.map((column, index) => (
                                <Chip
                                    key={index}
                                    label={column}
                                    color="primary"
                                    variant="outlined"
                                />
                            ))}
                        </Box>
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Box mt={2}>
                    <Typography variant="caption" color="text.secondary">
                        * 파일의 첫 번째 행이 자동으로 헤더(컬럼명)로 인식됩니다.
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} color="inherit">
                    취소
                </Button>
                <Button 
                    onClick={handleApply} 
                    variant="contained" 
                    disabled={!uploadSuccess || extractedColumns.length === 0}
                >
                    파라미터 적용
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default FileUploadModal;