import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Link, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        user_id: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
            const response = await axios.post('http://localhost:8000/api/auth/login', formData);
            
            // JWT 토큰을 localStorage에 저장
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user_id', formData.user_id);
            
            // 대시보드로 이동
            navigate('/dashboard');
        } catch (error) {
            setError(
                error.response?.data?.detail || 
                '로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.'
            );
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
                backgroundColor: '#f5f5f5'
            }}
        >
            <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%', mx: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    로그인
                </Typography>
                
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