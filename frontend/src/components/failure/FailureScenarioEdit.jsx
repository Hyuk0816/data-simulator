import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Grid,
    IconButton,
    Typography,
    Alert,
    Switch,
    FormControlLabel
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import axios from 'axios';

const FailureScenarioEdit = ({ open, onClose, scenario, onUpdated }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        is_active: true
    });
    
    const [parameters, setParameters] = useState([{ key: '', value: '' }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (scenario) {
            setFormData({
                name: scenario.name || '',
                description: scenario.description || '',
                is_active: scenario.is_active !== undefined ? scenario.is_active : true
            });

            // 파라미터를 배열로 변환
            const paramArray = Object.entries(scenario.failure_parameters || {}).map(([key, value]) => ({
                key,
                value: value !== null ? value.toString() : ''
            }));
            
            setParameters(paramArray.length > 0 ? paramArray : [{ key: '', value: '' }]);
        }
    }, [scenario]);

    const handleAddParameter = () => {
        setParameters([...parameters, { key: '', value: '' }]);
    };

    const handleRemoveParameter = (index) => {
        if (parameters.length > 1) {
            setParameters(parameters.filter((_, i) => i !== index));
        }
    };

    const handleParameterChange = (index, field, value) => {
        const updatedParameters = [...parameters];
        updatedParameters[index][field] = value;
        setParameters(updatedParameters);
    };

    const parseValue = (value) => {
        // 숫자로 변환 가능하면 숫자로, 아니면 문자열로
        if (value === '') return value;
        const num = Number(value);
        return !isNaN(num) ? num : value;
    };

    const handleSubmit = async () => {
        // 파라미터를 객체로 변환
        const failureParams = {};
        parameters.forEach(param => {
            if (param.key && param.value !== '') {
                failureParams[param.key] = parseValue(param.value);
            }
        });

        if (!formData.name) {
            setError('시나리오 이름을 입력해주세요.');
            return;
        }

        if (Object.keys(failureParams).length === 0) {
            setError('최소 하나 이상의 고장 파라미터를 입력해주세요.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `/api/failure-scenarios/${scenario.id}`,
                {
                    ...formData,
                    failure_parameters: failureParams
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (onUpdated) {
                onUpdated(response.data);
            }
            handleClose();
        } catch (error) {
            console.error('고장 시나리오 수정 실패:', error);
            setError(error.response?.data?.detail || '고장 시나리오 수정에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setError('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>고장 시나리오 수정</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="시나리오 이름"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="설명"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                multiline
                                rows={2}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    />
                                }
                                label="시나리오 활성화"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                고장 파라미터 설정
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                고장 발생 시 반환될 파라미터 값을 설정합니다.
                            </Typography>
                        </Grid>

                        {parameters.map((param, index) => (
                            <React.Fragment key={index}>
                                <Grid item xs={5}>
                                    <TextField
                                        fullWidth
                                        label="파라미터 키"
                                        value={param.key}
                                        onChange={(e) => handleParameterChange(index, 'key', e.target.value)}
                                        placeholder="예: temperature"
                                    />
                                </Grid>
                                <Grid item xs={5}>
                                    <TextField
                                        fullWidth
                                        label="고장 값"
                                        value={param.value}
                                        onChange={(e) => handleParameterChange(index, 'value', e.target.value)}
                                        placeholder="예: 999"
                                    />
                                </Grid>
                                <Grid item xs={2}>
                                    <IconButton
                                        onClick={() => handleRemoveParameter(index)}
                                        disabled={parameters.length === 1}
                                        color="error"
                                    >
                                        <Delete />
                                    </IconButton>
                                </Grid>
                            </React.Fragment>
                        ))}

                        <Grid item xs={12}>
                            <Button
                                startIcon={<Add />}
                                onClick={handleAddParameter}
                                variant="outlined"
                            >
                                파라미터 추가
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>취소</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || scenario?.is_applied}
                >
                    {loading ? '수정 중...' : '수정'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default FailureScenarioEdit;