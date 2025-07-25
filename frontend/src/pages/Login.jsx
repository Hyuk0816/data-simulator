import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Paper, Link, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        user_id: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // 이미 로그인된 사용자 체크
    useEffect(() => {
        const checkAuthStatus = async () => {
            if (authService.isAuthenticated()) {
                const user = await authService.checkAuthStatus();
                if (user) {
                    navigate('/dashboard');
                }
            }
        };
        checkAuthStatus();
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await authService.login(formData);
            
            // 로그인 성공 메시지 (선택사항)
            console.log('로그인 성공:', result.user.name);
            
            // 대시보드로 이동
            navigate('/dashboard');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
        >
            <Paper 
                elevation={3} 
                sx={{ 
                    p: 4, 
                    maxWidth: 400, 
                    width: '100%', 
                    mx: 2,
                    borderRadius: 2,
                    backdropFilter: 'blur(10px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)'
                }}
            >
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h4" component="h1" fontWeight={600} gutterBottom>
                        로그인
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Dynamic API Simulator에 오신 것을 환영합니다
                    </Typography>
                </Box>
                
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                
                <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="사용자 ID"
                        name="user_id"
                        value={formData.user_id}
                        onChange={handleChange}
                        margin="normal"
                        required
                        autoFocus
                    />
                    <TextField
                        fullWidth
                        label="비밀번호"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        margin="normal"
                        required
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {loading ? '로그인 중...' : '로그인'}
                    </Button>
                    
                    <Box sx={{ textAlign: 'center' }}>
                        <Link
                            component="button"
                            variant="body2"
                            onClick={(e) => {
                                e.preventDefault();
                                navigate('/register');
                            }}
                        >
                            계정이 없으신가요? 회원가입
                        </Link>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default Login;