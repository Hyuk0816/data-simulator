import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Link, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        user_id: '',
        password: '',
        password_confirm: ''
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

        // 비밀번호 확인
        if (formData.password !== formData.password_confirm) {
            setError('비밀번호가 일치하지 않습니다.');
            setLoading(false);
            return;
        }

        try {
            await axios.post('http://localhost:8000/api/auth/register', formData);
            
            // 회원가입 성공 시 로그인 페이지로 이동
            alert('회원가입이 완료되었습니다. 로그인해주세요.');
            navigate('/login');
        } catch (error) {
            setError(
                error.response?.data?.detail || 
                '회원가입에 실패했습니다. 다시 시도해주세요.'
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
                    회원가입
                </Typography>
                
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                
                <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="사용자 이름"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        margin="normal"
                        required
                        autoFocus
                    />
                    <TextField
                        fullWidth
                        label="사용자 ID"
                        name="user_id"
                        value={formData.user_id}
                        onChange={handleChange}
                        margin="normal"
                        required
                        helperText="로그인 시 사용할 ID입니다"
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
                    <TextField
                        fullWidth
                        label="비밀번호 확인"
                        name="password_confirm"
                        type="password"
                        value={formData.password_confirm}
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
                        {loading ? '가입 중...' : '회원가입'}
                    </Button>
                    
                    <Box sx={{ textAlign: 'center' }}>
                        <Link
                            component="button"
                            variant="body2"
                            onClick={(e) => {
                                e.preventDefault();
                                navigate('/login');
                            }}
                        >
                            이미 계정이 있으신가요? 로그인
                        </Link>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default Register;