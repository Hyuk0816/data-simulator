import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    IconButton,
    Chip,
    Grid,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Tooltip,
    Stack
} from '@mui/material';
import {
    Delete,
    Edit,
    PlayArrow,
    Stop,
    Add,
    Warning
} from '@mui/icons-material';
import api from '../../services/api';
import FailureScenarioCreate from './FailureScenarioCreate';
import FailureScenarioEdit from './FailureScenarioEdit';

const FailureScenarioList = ({ simulatorId = null, onApply = null }) => {
    const [scenarios, setScenarios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingScenario, setEditingScenario] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [scenarioToDelete, setScenarioToDelete] = useState(null);

    useEffect(() => {
        fetchScenarios();
    }, [simulatorId]);

    const fetchScenarios = async () => {
        setLoading(true);
        try {
            const url = simulatorId 
                ? `/api/failure-scenarios/simulator/${simulatorId}`
                : '/api/failure-scenarios';
            
            const response = await api.get(url);
            setScenarios(response.data);
        } catch (error) {
            console.error('고장 시나리오 목록 조회 실패:', error);
            setError('고장 시나리오 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!scenarioToDelete) return;

        try {
            await api.delete(`/api/failure-scenarios/${scenarioToDelete.id}`);
            
            setScenarios(scenarios.filter(s => s.id !== scenarioToDelete.id));
            setDeleteConfirmOpen(false);
            setScenarioToDelete(null);
        } catch (error) {
            console.error('고장 시나리오 삭제 실패:', error);
            setError(error.response?.data?.detail || '고장 시나리오 삭제에 실패했습니다.');
        }
    };

    const handleApply = async (scenario) => {
        if (!simulatorId) {
            setError('시뮬레이터가 선택되지 않았습니다.');
            return;
        }

        try {
            await api.post(
                `/api/failure-scenarios/apply/${simulatorId}`,
                { scenario_id: scenario.id }
            );
            
            // 적용 상태 업데이트
            fetchScenarios();
            
            if (onApply) {
                onApply(scenario);
            }
        } catch (error) {
            console.error('고장 시나리오 적용 실패:', error);
            setError(error.response?.data?.detail || '고장 시나리오 적용에 실패했습니다.');
        }
    };

    const handleRelease = async (scenario) => {
        if (!simulatorId) {
            setError('시뮬레이터가 선택되지 않았습니다.');
            return;
        }

        try {
            await api.post(
                `/api/failure-scenarios/release/${simulatorId}`,
                {}
            );
            
            // 적용 상태 업데이트
            fetchScenarios();
            
            if (onApply) {
                onApply(null);
            }
        } catch (error) {
            console.error('고장 시나리오 해제 실패:', error);
            setError(error.response?.data?.detail || '고장 시나리오 해제에 실패했습니다.');
        }
    };

    const formatParameters = (params) => {
        return Object.entries(params)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
    };

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5">
                    고장 시나리오 관리
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setCreateDialogOpen(true)}
                >
                    새 시나리오 생성
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Typography>로딩 중...</Typography>
            ) : scenarios.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography color="text.secondary" align="center">
                            생성된 고장 시나리오가 없습니다.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Grid container spacing={2}>
                    {scenarios.map((scenario) => (
                        <Grid item xs={12} md={6} lg={4} key={scenario.id}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                        <Typography variant="h6" component="div">
                                            {scenario.name}
                                        </Typography>
                                        <Stack direction="row" spacing={0.5}>
                                            {scenario.is_applied && (
                                                <Chip
                                                    label="적용 중"
                                                    color="error"
                                                    size="small"
                                                    icon={<Warning />}
                                                />
                                            )}
                                            {scenario.is_active ? (
                                                <Chip label="활성" color="success" size="small" />
                                            ) : (
                                                <Chip label="비활성" size="small" />
                                            )}
                                        </Stack>
                                    </Box>

                                    {scenario.description && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {scenario.description}
                                        </Typography>
                                    )}

                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            고장 파라미터:
                                        </Typography>
                                        <Typography variant="body2" sx={{ 
                                            backgroundColor: 'grey.100',
                                            p: 1,
                                            borderRadius: 1,
                                            fontFamily: 'monospace',
                                            fontSize: '0.85rem',
                                            wordBreak: 'break-all'
                                        }}>
                                            {formatParameters(scenario.failure_parameters)}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                        {simulatorId && (
                                            scenario.is_applied ? (
                                                <Tooltip title="시나리오 해제">
                                                    <IconButton
                                                        color="warning"
                                                        onClick={() => handleRelease(scenario)}
                                                        size="small"
                                                    >
                                                        <Stop />
                                                    </IconButton>
                                                </Tooltip>
                                            ) : (
                                                <Tooltip title="시나리오 적용">
                                                    <IconButton
                                                        color="primary"
                                                        onClick={() => handleApply(scenario)}
                                                        disabled={!scenario.is_active}
                                                        size="small"
                                                    >
                                                        <PlayArrow />
                                                    </IconButton>
                                                </Tooltip>
                                            )
                                        )}
                                        <Tooltip title="수정">
                                            <IconButton
                                                onClick={() => setEditingScenario(scenario)}
                                                size="small"
                                            >
                                                <Edit />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="삭제">
                                            <IconButton
                                                color="error"
                                                onClick={() => {
                                                    setScenarioToDelete(scenario);
                                                    setDeleteConfirmOpen(true);
                                                }}
                                                disabled={scenario.is_applied}
                                                size="small"
                                            >
                                                <Delete />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* 생성 다이얼로그 */}
            <FailureScenarioCreate
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                simulatorId={simulatorId}
                onCreated={(newScenario) => {
                    setScenarios([...scenarios, newScenario]);
                    setCreateDialogOpen(false);
                }}
            />

            {/* 수정 다이얼로그 */}
            {editingScenario && (
                <FailureScenarioEdit
                    open={Boolean(editingScenario)}
                    onClose={() => setEditingScenario(null)}
                    scenario={editingScenario}
                    onUpdated={(updatedScenario) => {
                        setScenarios(scenarios.map(s => 
                            s.id === updatedScenario.id ? updatedScenario : s
                        ));
                        setEditingScenario(null);
                    }}
                />
            )}

            {/* 삭제 확인 다이얼로그 */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <DialogTitle>고장 시나리오 삭제</DialogTitle>
                <DialogContent>
                    <Typography>
                        "{scenarioToDelete?.name}" 시나리오를 삭제하시겠습니까?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        이 작업은 되돌릴 수 없습니다.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>취소</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        삭제
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default FailureScenarioList;