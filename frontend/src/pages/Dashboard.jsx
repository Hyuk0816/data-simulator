import React, { useState, useEffect } from 'react';
import {
    Typography,
    Grid,
    Card,
    CardContent,
    CardActions,
    Switch,
    FormControlLabel,
    Button,
    Chip,
    Box,
    Fab,
    Skeleton,
    Fade,
    Tooltip,
    IconButton,
    Container,
    Paper,
    Avatar,
    Grow,
    Snackbar,
    Alert,
    alpha
} from '@mui/material';
import {
    Add as AddIcon,
    ContentCopy as CopyIcon,
    OpenInNew as OpenInNewIcon,
    Code as CodeIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ApiOutlined,
    Speed as SpeedIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Webhook as WebhookIcon,
    Warning as WarningIcon,
    BuildCircle as BuildCircleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import simulatorService from '../services/simulatorService';
import FailureScenarioSelector from '../components/failure/FailureScenarioSelector';
import FailureScenarioCreateFromSimulator from '../components/failure/FailureScenarioCreateFromSimulator';

const Dashboard = ({ darkMode, setDarkMode }) => {
    const navigate = useNavigate();
    const [simulators, setSimulators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState({});
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [createScenarioDialog, setCreateScenarioDialog] = useState({ open: false, simulator: null });

    useEffect(() => {
        fetchSimulators();
    }, []);

    const fetchSimulators = async () => {
        try {
            const data = await simulatorService.getSimulators();
            setSimulators(data);
        } catch (error) {
            console.error('Error fetching simulators:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleSimulator = async (id) => {
        try {
            await simulatorService.toggleSimulator(id);
            fetchSimulators();
        } catch (error) {
            console.error('Error toggling simulator:', error);
        }
    };

    const handleEdit = (id) => {
        navigate(`/edit-simulator/${id}`);
    };

    const handleDelete = async (id) => {
        if (window.confirm('정말로 이 시뮬레이터를 삭제하시겠습니까?')) {
            setDeleteLoading(prev => ({ ...prev, [id]: true }));
            try {
                await simulatorService.deleteSimulator(id);
                fetchSimulators();
            } catch (error) {
                console.error('Error deleting simulator:', error);
                alert('시뮬레이터 삭제에 실패했습니다.');
            } finally {
                setDeleteLoading(prev => ({ ...prev, [id]: false }));
            }
        }
    };

    const handleCreateScenario = (simulator) => {
        setCreateScenarioDialog({ open: true, simulator });
    };

    const handleScenarioCreated = () => {
        setSnackbar({ 
            open: true, 
            message: '고장 시나리오가 성공적으로 생성되었습니다.', 
            severity: 'success' 
        });
        // 시뮬레이터 목록 새로고침
        fetchSimulators();
    };

    const copyApiUrl = (simulator) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const url = simulatorService.getSimulatorEndpoint(user.user_id, simulator.name);
        navigator.clipboard.writeText(url);
        setSnackbar({
            open: true,
            message: 'API 엔드포인트가 클립보드에 복사되었습니다!',
            severity: 'success'
        });
    };

    const openApiTest = (simulator) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const url = simulatorService.getSimulatorEndpoint(user.user_id, simulator.name);
        window.open(url, '_blank');
    };

    const LoadingSkeleton = () => (
        <Grid container spacing={3}>
            {[1, 2, 3].map((item) => (
                <Grid item xs={12} md={6} lg={4} key={item}>
                    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
                </Grid>
            ))}
        </Grid>
    );

    return (
        <Layout darkMode={darkMode} setDarkMode={setDarkMode}>
            {/* 헤더 섹션 */}
            <Paper 
                elevation={0} 
                sx={{ 
                    background: (theme) => 
                        theme.palette.mode === 'dark' 
                            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.15)} 0%, ${alpha(theme.palette.secondary.dark, 0.15)} 100%)`
                            : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.15)} 0%, ${alpha(theme.palette.secondary.light, 0.15)} 100%)`,
                    borderRadius: 3,
                    p: 4,
                    mb: 4,
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar 
                            sx={{ 
                                bgcolor: 'primary.main',
                                width: 56, 
                                height: 56,
                                boxShadow: 3
                            }}
                        >
                            <ApiOutlined fontSize="large" />
                        </Avatar>
                        <Box>
                            <Typography variant="h4" component="h1" fontWeight={700}>
                                시뮬레이터 대시보드
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                동적 API 엔드포인트를 생성하고 관리하세요
                            </Typography>
                        </Box>
                    </Box>
                    
                    {/* 통계 카드 */}
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                        <Grid item xs={12} sm={4}>
                            <Box 
                                sx={{ 
                                    bgcolor: 'background.paper',
                                    borderRadius: 2,
                                    p: 2,
                                    textAlign: 'center',
                                    boxShadow: 1
                                }}
                            >
                                <Typography variant="h3" fontWeight={600} color="primary.main">
                                    {simulators.length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    전체 시뮬레이터
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Box 
                                sx={{ 
                                    bgcolor: 'background.paper',
                                    borderRadius: 2,
                                    p: 2,
                                    textAlign: 'center',
                                    boxShadow: 1
                                }}
                            >
                                <Typography variant="h3" fontWeight={600} color="success.main">
                                    {simulators.filter(s => s.is_active).length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    활성 시뮬레이터
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Box 
                                sx={{ 
                                    bgcolor: 'background.paper',
                                    borderRadius: 2,
                                    p: 2,
                                    textAlign: 'center',
                                    boxShadow: 1
                                }}
                            >
                                <Typography variant="h3" fontWeight={600} color="text.secondary">
                                    {simulators.filter(s => !s.is_active).length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    비활성 시뮬레이터
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
                
                {/* 장식적 요소 */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: -50,
                        right: -50,
                        width: 200,
                        height: 200,
                        borderRadius: '50%',
                        background: (theme) => alpha(theme.palette.primary.main, 0.1),
                        filter: 'blur(40px)'
                    }}
                />
            </Paper>

            {loading ? (
                <LoadingSkeleton />
            ) : simulators.length === 0 ? (
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                        <Typography variant="h5" gutterBottom>
                            아직 생성된 시뮬레이터가 없습니다
                        </Typography>
                        <Typography variant="body1" color="text.secondary" paragraph>
                            첫 번째 API 시뮬레이터를 만들어 동적 엔드포인트를 생성해보세요
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<AddIcon />}
                            onClick={() => navigate('/create-simulator')}
                            sx={{ mt: 3 }}
                        >
                            첫 시뮬레이터 만들기
                        </Button>
                    </Box>
            ) : (
                <Fade in={!loading}>
                    <Grid container spacing={3}>
                        {simulators.map((simulator, index) => (
                            <Grid item xs={12} md={6} lg={4} key={simulator.id}>
                                <Grow in={true} timeout={300 + (index * 100)}>
                                    <Card
                                        elevation={0}
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            border: (theme) => `1px solid ${theme.palette.divider}`,
                                            borderRadius: 2,
                                            position: 'relative',
                                            overflow: 'visible',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            '&:hover': {
                                                transform: 'translateY(-8px)',
                                                boxShadow: (theme) => `0 16px 40px -12px ${alpha(theme.palette.common.black, 0.15)}`,
                                                borderColor: 'primary.main'
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                            {/* 헤더 섹션 */}
                                            <Box sx={{ mb: 3 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                                    <Avatar 
                                                        sx={{ 
                                                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                                                            color: 'primary.main',
                                                            width: 40,
                                                            height: 40
                                                        }}
                                                    >
                                                        <WebhookIcon />
                                                    </Avatar>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                            <Typography 
                                                                variant="h5" 
                                                                component="h2" 
                                                                fontWeight={700}
                                                                sx={{ mb: 0 }}
                                                            >
                                                                {simulator.name}
                                                            </Typography>
                                                            <Chip
                                                                icon={simulator.is_active ? <CheckCircleIcon /> : <CancelIcon />}
                                                                label={simulator.is_active ? "활성" : "비활성"}
                                                                color={simulator.is_active ? "success" : "default"}
                                                                size="small"
                                                                sx={{ fontWeight: 500 }}
                                                            />
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </Box>

                                            {/* API 엔드포인트 섹션 */}
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    bgcolor: (theme) => theme.palette.mode === 'dark'
                                                        ? alpha(theme.palette.primary.dark, 0.08)
                                                        : alpha(theme.palette.primary.light, 0.08),
                                                    p: 2,
                                                    borderRadius: 1.5,
                                                    mb: 2.5,
                                                    border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                    <CodeIcon fontSize="small" color="primary" />
                                                    <Typography variant="caption" fontWeight={600} color="primary">
                                                        API ENDPOINT
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontFamily: 'monospace',
                                                            fontSize: '0.8rem',
                                                            wordBreak: 'break-all',
                                                            flex: 1,
                                                            color: 'text.primary'
                                                        }}
                                                    >
                                                        /api/data/{JSON.parse(localStorage.getItem('user') || '{}').user_id}/{simulator.name}
                                                    </Typography>
                                                    <Tooltip title="복사" placement="top">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => copyApiUrl(simulator)}
                                                            sx={{
                                                                bgcolor: 'background.paper',
                                                                '&:hover': {
                                                                    bgcolor: 'primary.main',
                                                                    color: 'primary.contrastText'
                                                                }
                                                            }}
                                                        >
                                                            <CopyIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </Paper>

                                            {/* 파라미터 미리보기 */}
                                            <Box sx={{ mb: 2 }}>
                                                <Typography 
                                                    variant="caption" 
                                                    fontWeight={600} 
                                                    color="text.secondary" 
                                                    sx={{ display: 'block', mb: 1, textTransform: 'uppercase' }}
                                                >
                                                    Response Preview
                                                </Typography>
                                                <Paper
                                                    elevation={0}
                                                    sx={{
                                                        fontSize: '0.75rem',
                                                        fontFamily: 'monospace',
                                                        overflow: 'auto',
                                                        bgcolor: (theme) => theme.palette.mode === 'dark' 
                                                            ? 'grey.900' 
                                                            : 'grey.50',
                                                        color: (theme) => theme.palette.mode === 'dark' 
                                                            ? 'grey.100' 
                                                            : 'grey.800',
                                                        p: 1.5,
                                                        borderRadius: 1,
                                                        maxHeight: 120,
                                                        border: (theme) => `1px solid ${theme.palette.divider}`,
                                                        '& pre': {
                                                            margin: 0
                                                        }
                                                    }}
                                                >
                                                    <pre>{(() => {
                                                        const params = { ...simulator.parameters };
                                                        const config = simulator.parameter_config || {};
                                                        
                                                        // 랜덤 설정된 파라미터는 범위를 표시
                                                        Object.keys(config).forEach(key => {
                                                            if (config[key]?.is_random && config[key]?.min !== null && config[key]?.max !== null) {
                                                                params[key] = `랜덤 (${config[key].min}~${config[key].max})`;
                                                            }
                                                        });
                                                        
                                                        return JSON.stringify(params, null, 2);
                                                    })()}</pre>
                                                </Paper>
                                            </Box>

                                            {/* 활성화 스위치 */}
                                            <Box 
                                                sx={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
                                                    borderRadius: 1,
                                                    p: 1,
                                                    mb: 2
                                                }}
                                            >
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={simulator.is_active}
                                                            onChange={() => toggleSimulator(simulator.id)}
                                                            color="success"
                                                        />
                                                    }
                                                    label={
                                                        <Typography variant="body2" fontWeight={500}>
                                                            API 활성화
                                                        </Typography>
                                                    }
                                                    sx={{ ml: 0 }}
                                                />
                                                <Chip 
                                                    icon={<SpeedIcon />}
                                                    label="실시간" 
                                                    size="small" 
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </Box>

                                            {/* 고장 시나리오 섹션 */}
                                            {simulator.is_active && (
                                                <Box sx={{ mt: 2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                                        <Typography variant="subtitle2" color="text.secondary">
                                                            고장 시나리오
                                                        </Typography>
                                                        <Button
                                                            size="small"
                                                            startIcon={<BuildCircleIcon />}
                                                            onClick={() => handleCreateScenario(simulator)}
                                                            sx={{ textTransform: 'none' }}
                                                        >
                                                            시나리오 생성
                                                        </Button>
                                                    </Box>
                                                    <FailureScenarioSelector
                                                        simulatorId={simulator.id}
                                                        simulatorName={simulator.name}
                                                        compact={true}
                                                        onScenarioChange={(scenario) => {
                                                            console.log('Scenario changed:', scenario);
                                                            // 필요시 상태 업데이트
                                                        }}
                                                    />
                                                </Box>
                                            )}
                                        </CardContent>
                                        
                                        {/* 액션 버튼 */}
                                        <CardActions 
                                            sx={{ 
                                                px: 3, 
                                                pb: 3, 
                                                pt: 2,
                                                gap: 1,
                                                borderTop: (theme) => `1px solid ${theme.palette.divider}`
                                            }}
                                        >
                                            <Button
                                                variant="contained"
                                                size="medium"
                                                startIcon={<OpenInNewIcon />}
                                                onClick={() => openApiTest(simulator)}
                                                disabled={!simulator.is_active}
                                                sx={{ 
                                                    flex: 1,
                                                    textTransform: 'none',
                                                    fontWeight: 600,
                                                    boxShadow: 'none',
                                                    '&:hover': {
                                                        boxShadow: 2
                                                    }
                                                }}
                                            >
                                                테스트
                                            </Button>
                                            <Tooltip title="수정">
                                                <IconButton
                                                    onClick={() => handleEdit(simulator.id)}
                                                    sx={{
                                                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                                                        color: 'primary.main',
                                                        '&:hover': {
                                                            bgcolor: 'primary.main',
                                                            color: 'primary.contrastText'
                                                        }
                                                    }}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="삭제">
                                                <IconButton
                                                    onClick={() => handleDelete(simulator.id)}
                                                    disabled={deleteLoading[simulator.id]}
                                                    sx={{
                                                        bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
                                                        color: 'error.main',
                                                        '&:hover': {
                                                            bgcolor: 'error.main',
                                                            color: 'error.contrastText'
                                                        }
                                                    }}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </CardActions>
                                    </Card>
                                </Grow>
                            </Grid>
                        ))}
                    </Grid>
                </Fade>
            )}

            {/* Floating Action Button */}
            <Tooltip title="새 시뮬레이터 만들기" placement="left">
                <Fab
                    color="primary"
                    aria-label="add"
                    sx={{
                        position: 'fixed',
                        bottom: 32,
                        right: 32,
                        width: 64,
                        height: 64,
                        boxShadow: 4,
                        '&:hover': {
                            transform: 'scale(1.1)',
                            boxShadow: 6
                        },
                        transition: 'all 0.3s ease'
                    }}
                    onClick={() => navigate('/create-simulator')}
                >
                    <AddIcon sx={{ fontSize: 28 }} />
                </Fab>
            </Tooltip>
            
            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={() => setSnackbar({ ...snackbar, open: false })} 
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* 고장 시나리오 생성 다이얼로그 */}
            <FailureScenarioCreateFromSimulator
                open={createScenarioDialog.open}
                onClose={() => setCreateScenarioDialog({ open: false, simulator: null })}
                simulator={createScenarioDialog.simulator}
                onCreated={handleScenarioCreated}
            />
        </Layout>
    );
};

export default Dashboard;