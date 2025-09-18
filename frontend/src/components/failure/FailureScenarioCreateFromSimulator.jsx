import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Divider,
    CircularProgress
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import api from '../../services/api';

const FailureScenarioCreateFromSimulator = ({ 
    open, 
    onClose, 
    simulator, 
    onCreated 
}) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        simulator_id: null,
        failure_parameters: {}
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open && simulator) {
            // 시뮬레이터 정보로 초기화
            setFormData({
                name: '',
                description: '',
                simulator_id: simulator.id,
                failure_parameters: {}
            });
            
            // 시뮬레이터의 파라미터를 복사하여 초기 고장 값 설정
            const initialFailureParams = {};
            if (simulator.parameters) {
                Object.keys(simulator.parameters).forEach(key => {
                    initialFailureParams[key] = simulator.parameters[key];
                });
            }
            setFormData(prev => ({
                ...prev,
                failure_parameters: initialFailureParams
            }));
        }
    }, [open, simulator]);

    const handleParameterChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            failure_parameters: {
                ...prev.failure_parameters,
                [key]: parseValue(value)
            }
        }));
    };

    const parseValue = (value) => {
        if (value === '') return value;
        const num = Number(value);
        return !isNaN(num) && value !== '' && value !== null ? num : value;
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            setError('시나리오 이름을 입력해주세요.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/api/failure-scenarios/', {
                ...formData,
                is_active: true
            });
            
            if (onCreated) {
                onCreated();
            }
            handleClose();
        } catch (error) {
            console.error('고장 시나리오 생성 실패:', error);
            setError(error.response?.data?.detail || '고장 시나리오 생성에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            description: '',
            simulator_id: null,
            failure_parameters: {}
        });
        setError('');
        onClose();
    };

    if (!simulator) {
        return null;
    }

    return (
        <Dialog 
            open={open} 
            onClose={handleClose} 
            maxWidth="md" 
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    minHeight: '60vh'
                }
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <WarningIcon color="error" />
                    <Typography variant="h6">고장 시나리오 생성</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    시뮬레이터: {simulator.name}
                </Typography>
            </DialogTitle>

            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <TextField
                        fullWidth
                        label="시나리오 이름"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        sx={{ mb: 2 }}
                        placeholder="예: 센서 오작동, 네트워크 장애"
                    />

                    <TextField
                        fullWidth
                        label="설명"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        multiline
                        rows={2}
                        sx={{ mb: 3 }}
                        placeholder="이 고장 시나리오에 대한 설명을 입력하세요"
                    />

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="h6" sx={{ mb: 2 }}>
                        고장 파라미터 설정
                    </Typography>

                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>파라미터</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>정상값</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>고장값</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {simulator.parameters && Object.entries(simulator.parameters).map(([key, normalValue]) => {
                                    // parameter_config에서 해당 파라미터의 설정 정보 가져오기
                                    const paramConfig = simulator.parameter_config?.[key] || {};
                                    const isRandom = paramConfig.is_random;
                                    const min = paramConfig.min;
                                    const max = paramConfig.max;
                                    
                                    // 정상값 표시 텍스트 생성
                                    let normalValueDisplay = normalValue;
                                    if (isRandom && min !== undefined && max !== undefined) {
                                        normalValueDisplay = `랜덤 (${min}~${max})`;
                                    }
                                    
                                    return (
                                        <TableRow key={key}>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                    {key}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {normalValueDisplay}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                            <TextField
                                                size="small"
                                                fullWidth
                                                value={formData.failure_parameters[key] ?? ''}
                                                onChange={(e) => handleParameterChange(key, e.target.value)}
                                                placeholder="고장 시 값"
                                                sx={{ 
                                                    '& .MuiInputBase-input': { 
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.875rem'
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                    );
                                })}
                                {(!simulator.parameters || Object.keys(simulator.parameters).length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center">
                                            <Typography variant="body2" color="text.secondary">
                                                시뮬레이터에 정의된 파라미터가 없습니다.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Alert severity="info" sx={{ mt: 2 }}>
                        고장값을 비워두면 해당 파라미터는 정상값을 유지합니다.
                    </Alert>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={handleClose} disabled={loading}>
                    취소
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    disabled={loading}
                    startIcon={loading && <CircularProgress size={20} />}
                >
                    생성
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default FailureScenarioCreateFromSimulator;