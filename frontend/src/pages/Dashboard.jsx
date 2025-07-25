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
    IconButton
} from '@mui/material';
import {
    Add as AddIcon,
    ContentCopy as CopyIcon,
    OpenInNew as OpenInNewIcon,
    Code as CodeIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/common/Layout';
import simulatorService from '../services/simulatorService';

const Dashboard = ({ darkMode, setDarkMode }) => {
    const navigate = useNavigate();
    const [simulators, setSimulators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState({});

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

    const copyApiUrl = (simulator) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const url = simulatorService.getSimulatorEndpoint(user.user_id, simulator.name);
        navigator.clipboard.writeText(url);
        // You can add a toast notification here
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
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
                    시뮬레이터 대시보드
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    생성한 API 시뮬레이터를 관리하고 테스트해보세요
                </Typography>
            </Box>

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
                                <Fade in={true} timeout={300 * (index + 1)}>
                                    <Card
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: 4
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                <Typography variant="h6" component="h2" fontWeight={500}>
                                                    {simulator.name}
                                                </Typography>
                                                <Chip
                                                    label={simulator.is_active ? "활성" : "비활성"}
                                                    color={simulator.is_active ? "success" : "default"}
                                                    size="small"
                                                />
                                            </Box>

                                            <Box sx={{
                                                bgcolor: 'background.default',
                                                p: 1.5,
                                                borderRadius: 1,
                                                mb: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1
                                            }}>
                                                <CodeIcon fontSize="small" color="primary" />
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        fontFamily: 'monospace',
                                                        wordBreak: 'break-all',
                                                        flex: 1
                                                    }}
                                                >
                                                    /api/data/{JSON.parse(localStorage.getItem('user') || '{}').user_id}/{simulator.name}
                                                </Typography>
                                                <Tooltip title="복사">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => copyApiUrl(simulator)}
                                                    >
                                                        <CopyIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>

                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                                    응답 파라미터
                                                </Typography>
                                                <Box
                                                    component="pre"
                                                    sx={{
                                                        fontSize: '0.75rem',
                                                        overflow: 'auto',
                                                        bgcolor: (theme) => theme.palette.mode === 'dark' 
                                                            ? 'grey.900' 
                                                            : 'grey.100',
                                                        color: (theme) => theme.palette.mode === 'dark' 
                                                            ? 'grey.100' 
                                                            : 'grey.900',
                                                        p: 1,
                                                        borderRadius: 1,
                                                        m: 0,
                                                        maxHeight: 100,
                                                        border: (theme) => `1px solid ${theme.palette.divider}`
                                                    }}
                                                >
                                                    {JSON.stringify(simulator.parameters, null, 2)}
                                                </Box>
                                            </Box>

                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={simulator.is_active}
                                                        onChange={() => toggleSimulator(simulator.id)}
                                                        size="small"
                                                    />
                                                }
                                                label="API 활성화"
                                                sx={{ ml: 0 }}
                                            />
                                        </CardContent>
                                        <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<OpenInNewIcon />}
                                                onClick={() => openApiTest(simulator)}
                                                disabled={!simulator.is_active}
                                                sx={{ flex: 1 }}
                                            >
                                                테스트
                                            </Button>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(simulator.id)}
                                                color="primary"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(simulator.id)}
                                                color="error"
                                                disabled={deleteLoading[simulator.id]}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </CardActions>
                                    </Card>
                                </Fade>
                            </Grid>
                        ))}
                    </Grid>
                </Fade>
            )}

            <Tooltip title="새 시뮬레이터 만들기" placement="left">
                <Fab
                    color="primary"
                    aria-label="add"
                    sx={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                    }}
                    onClick={() => navigate('/create-simulator')}
                >
                    <AddIcon />
                </Fab>
            </Tooltip>
        </Layout>
    );
};

export default Dashboard;