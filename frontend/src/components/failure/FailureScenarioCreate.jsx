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
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import axios from 'axios';

const FailureScenarioCreate = ({ open, onClose, simulatorId = null, onCreated }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        simulator_id: simulatorId,
        failure_parameters: {}
    });
    
    const [parameters, setParameters] = useState([{ key: '', value: '' }]);
    const [simulators, setSimulators] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open && !simulatorId) {
            fetchSimulators();
        }
    }, [open, simulatorId]);

    const fetchSimulators = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/simulators', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSimulators(response.data.items || []);
        } catch (error) {
            console.error('시뮬레이터 목록 조회 실패:', error);
        }
    };

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
            const response = await axios.post(
                '/api/failure-scenarios',
                {
                    ...formData,
                    failure_parameters: failureParams
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (onCreated) {
                onCreated(response.data);
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
            simulator_id: simulatorId,
            failure_parameters: {}
        });
        setParameters([{ key: '', value: '' }]);
        setError('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>고장 시나리오 생성</DialogTitle>
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

                        {!simulatorId && (
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>시뮬레이터 선택 (선택사항)</InputLabel>
                                    <Select
                                        value={formData.simulator_id || ''}
                                        onChange={(e) => setFormData({ ...formData, simulator_id: e.target.value || null })}
                                        label="시뮬레이터 선택 (선택사항)"
                                    >
                                        <MenuItem value="">
                                            <em>없음</em>
                                        </MenuItem>
                                        {simulators.map((sim) => (
                                            <MenuItem key={sim.id} value={sim.id}>
                                                {sim.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

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
                    disabled={loading}
                >
                    {loading ? '생성 중...' : '생성'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default FailureScenarioCreate;