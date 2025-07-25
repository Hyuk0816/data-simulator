import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    Switch,
    FormControlLabel,
    Button,
    Chip,
    Box,
    AppBar,
    Toolbar,
    IconButton,
    Fab
} from '@mui/material';
import { Add as AddIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
    const navigate = useNavigate();
    const [simulators, setSimulators] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSimulators();
    }, []);

    const fetchSimulators = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8000/api/simulators', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setSimulators(response.data);
        } catch (error) {
            console.error('Error fetching simulators:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleSimulator = async (id, isActive) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:8000/api/simulators/${id}`,
                { is_active: !isActive },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            fetchSimulators();
        } catch (error) {
            console.error('Error toggling simulator:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        navigate('/login');
    };

    const openApiTest = (simulator) => {
        const userId = localStorage.getItem('user_id');
        const url = `http://localhost:8000/api/data/${userId}-${simulator.name}`;
        window.open(url, '_blank');
    };

    if (loading) {
        return (
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '100vh' 
            }}>
                <Typography>로딩 중...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        동적 API 시뮬레이터
                    </Typography>
                    <IconButton
                        color="inherit"
                        onClick={handleLogout}
                        title="로그아웃"
                    >
                        <LogoutIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    시뮬레이터 대시보드
                </Typography>
                
                {simulators.length === 0 ? (
                    <Box sx={{ textAlign: 'center', mt: 4 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            아직 생성된 시뮬레이터가 없습니다.
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate('/create-simulator')}
                            sx={{ mt: 2 }}
                        >
                            첫 시뮬레이터 만들기
                        </Button>
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        {simulators.map((simulator) => (
                            <Grid item xs={12} md={6} lg={4} key={simulator.id}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" component="h2" gutterBottom>
                                            {simulator.name}
                                        </Typography>
                                        
                                        <Chip 
                                            label={simulator.is_active ? "활성" : "비활성"}
                                            color={simulator.is_active ? "success" : "default"}
                                            sx={{ mb: 2 }}
                                        />
                                        
                                        <Typography 
                                            variant="body2" 
                                            color="text.secondary" 
                                            gutterBottom
                                            sx={{ 
                                                wordBreak: 'break-all',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            API: /api/data/{localStorage.getItem('user_id')}-{simulator.name}
                                        </Typography>
                                        
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                파라미터:
                                            </Typography>
                                            <pre style={{ 
                                                fontSize: '0.75rem', 
                                                overflow: 'auto',
                                                backgroundColor: '#f5f5f5',
                                                padding: '8px',
                                                borderRadius: '4px'
                                            }}>
                                                {JSON.stringify(simulator.parameters, null, 2)}
                                            </pre>
                                        </Box>
                                        
                                        <Box sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center' 
                                        }}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={simulator.is_active}
                                                        onChange={() => toggleSimulator(
                                                            simulator.id, 
                                                            simulator.is_active
                                                        )}
                                                    />
                                                }
                                                label={simulator.is_active ? "활성화" : "비활성화"}
                                            />
                                            
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => openApiTest(simulator)}
                                            >
                                                API 테스트
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
                
                <Fab
                    color="primary"
                    aria-label="add"
                    sx={{
                        position: 'fixed',
                        bottom: 16,
                        right: 16,
                    }}
                    onClick={() => navigate('/create-simulator')}
                >
                    <AddIcon />
                </Fab>
            </Container>
        </Box>
    );
};

export default Dashboard;