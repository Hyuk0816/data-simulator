import React, { useState, useEffect } from 'react';
import {
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Chip,
    Stack,
    CircularProgress,
    Typography,
    Alert,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Warning,
    PlayArrow,
    Stop,
    Settings,
    Add
} from '@mui/icons-material';
import api from '../../services/api';

const FailureScenarioSelector = ({ 
    simulatorId, 
    simulatorName,
    onScenarioChange,
    compact = false 
}) => {
    const [scenarios, setScenarios] = useState([]);
    const [selectedScenario, setSelectedScenario] = useState(null);
    const [appliedScenario, setAppliedScenario] = useState(null);
    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (simulatorId) {
            fetchScenarios();
            checkAppliedScenario();
        }
    }, [simulatorId]);

    const fetchScenarios = async () => {
        setLoading(true);
        try {
            // 해당 시뮬레이터의 시나리오만 가져오기
            const response = await api.get(`/api/failure-scenarios/simulator/${simulatorId}`);
            
            console.log('Fetched scenarios for simulator', simulatorId, ':', response.data);
            
            // 활성화된 시나리오만 필터링
            const activeScenarios = response.data.filter(s => s.is_active);
            console.log('Active scenarios:', activeScenarios);
            
            setScenarios(activeScenarios);
        } catch (error) {
            console.error('시나리오 목록 조회 실패:', error);
            setError('시나리오 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const checkAppliedScenario = async () => {
        try {
            const response = await api.get(`/api/failure-scenarios/simulator/${simulatorId}/current`);
            
            if (response.data.active_scenario_id) {
                setAppliedScenario({
                    id: response.data.active_scenario_id,
                    name: response.data.active_scenario_name
                });
            }
        } catch (error) {
            // 적용된 시나리오가 없을 수 있음
            console.log('No applied scenario');
        }
    };

    const handleApply = async () => {
        if (!selectedScenario) return;

        setApplying(true);
        setError('');
        
        try {
            await api.post(
                `/api/failure-scenarios/apply/${simulatorId}`,
                { scenario_id: selectedScenario }
            );
            
            const scenario = scenarios.find(s => s.id === selectedScenario);
            setAppliedScenario(scenario);
            
            if (onScenarioChange) {
                onScenarioChange(scenario);
            }
        } catch (error) {
            console.error('시나리오 적용 실패:', error);
            setError(error.response?.data?.detail || '시나리오 적용에 실패했습니다.');
        } finally {
            setApplying(false);
        }
    };

    const handleRelease = async () => {
        setApplying(true);
        setError('');
        
        try {
            await api.post(
                `/api/failure-scenarios/release/${simulatorId}`,
                {}
            );
            
            setAppliedScenario(null);
            setSelectedScenario(null);
            
            if (onScenarioChange) {
                onScenarioChange(null);
            }
        } catch (error) {
            console.error('시나리오 해제 실패:', error);
            setError(error.response?.data?.detail || '시나리오 해제에 실패했습니다.');
        } finally {
            setApplying(false);
        }
    };

    if (compact) {
        // 컴팩트 모드 (대시보드 카드용)
        console.log('Compact mode - scenarios:', scenarios);
        console.log('Compact mode - loading:', loading);
        console.log('Compact mode - selectedScenario:', selectedScenario);
        
        return (
            <Box sx={{ mt: 2 }}>
                {appliedScenario ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                            icon={<Warning />}
                            label={`고장: ${appliedScenario.name}`}
                            color="error"
                            size="small"
                        />
                        <Tooltip title="고장 시나리오 해제">
                            <IconButton
                                size="small"
                                color="warning"
                                onClick={handleRelease}
                                disabled={applying}
                            >
                                {applying ? <CircularProgress size={16} /> : <Stop />}
                            </IconButton>
                        </Tooltip>
                    </Stack>
                ) : (
                    <Stack direction="row" spacing={1} alignItems="center">
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <Select
                                value={selectedScenario || ''}
                                onChange={(e) => setSelectedScenario(e.target.value)}
                                displayEmpty
                                disabled={loading || scenarios.length === 0}
                            >
                                <MenuItem value="">
                                    <em>
                                        {loading ? '로딩 중...' : 
                                         scenarios.length === 0 ? '시나리오 없음' : 
                                         '시나리오 선택'}
                                    </em>
                                </MenuItem>
                                {scenarios.map((scenario) => (
                                    <MenuItem key={scenario.id} value={scenario.id}>
                                        {scenario.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Tooltip title="고장 시나리오 적용">
                            <IconButton
                                size="small"
                                color="primary"
                                onClick={handleApply}
                                disabled={!selectedScenario || applying}
                            >
                                {applying ? <CircularProgress size={16} /> : <PlayArrow />}
                            </IconButton>
                        </Tooltip>
                    </Stack>
                )}
            </Box>
        );
    }

    // 전체 모드
    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                고장 시나리오 관리
            </Typography>
            
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {appliedScenario ? (
                <Box>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        현재 "{appliedScenario.name}" 시나리오가 적용 중입니다.
                    </Alert>
                    <Button
                        variant="contained"
                        color="warning"
                        startIcon={<Stop />}
                        onClick={handleRelease}
                        disabled={applying}
                    >
                        {applying ? '해제 중...' : '시나리오 해제'}
                    </Button>
                </Box>
            ) : (
                <Stack spacing={2}>
                    <FormControl fullWidth>
                        <InputLabel>고장 시나리오 선택</InputLabel>
                        <Select
                            value={selectedScenario || ''}
                            onChange={(e) => setSelectedScenario(e.target.value)}
                            label="고장 시나리오 선택"
                            disabled={loading}
                        >
                            <MenuItem value="">
                                <em>선택 안함</em>
                            </MenuItem>
                            {scenarios.map((scenario) => (
                                <MenuItem key={scenario.id} value={scenario.id}>
                                    {scenario.name}
                                    {scenario.description && (
                                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                            ({scenario.description})
                                        </Typography>
                                    )}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="contained"
                            startIcon={<PlayArrow />}
                            onClick={handleApply}
                            disabled={!selectedScenario || applying}
                        >
                            {applying ? '적용 중...' : '시나리오 적용'}
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={() => window.location.href = '/failure-scenarios'}
                        >
                            새 시나리오 생성
                        </Button>
                    </Stack>

                    {scenarios.length === 0 && !loading && (
                        <Alert severity="info">
                            생성된 고장 시나리오가 없습니다. 먼저 시나리오를 생성해주세요.
                        </Alert>
                    )}
                </Stack>
            )}
        </Box>
    );
};

export default FailureScenarioSelector;