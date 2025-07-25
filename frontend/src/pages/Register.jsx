import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Link, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import userService from '../services/userService';

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
    const [fieldErrors, setFieldErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        setError('');
        
        // 실시간 필드 검증
        validateField(name, value);
    };

    const validateField = (fieldName, value) => {
        let validationResult = { isValid: true, message: '' };
        
        switch (fieldName) {
            case 'name':
                validationResult = userService.validateName(value);
                break;
            case 'user_id':
                validationResult = userService.validateUserId(value);
                break;
            case 'password':
                if (value.length > 0) {
                    validationResult = userService.validatePassword(value, formData.password_confirm);
                }
                break;
            case 'password_confirm':
                if (value.length > 0) {
                    validationResult = userService.validatePassword(formData.password, value);
                }
                break;
            default:
                break;
        }
        
        setFieldErrors(prev => ({
            ...prev,
            [fieldName]: validationResult.isValid ? '' : validationResult.message
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // 모든 필드 재검증
        const nameValidation = userService.validateName(formData.name);
        const userIdValidation = userService.validateUserId(formData.user_id);
        const passwordValidation = userService.validatePassword(formData.password, formData.password_confirm);

        if (!nameValidation.isValid || !userIdValidation.isValid || !passwordValidation.isValid) {
            setFieldErrors({
                name: nameValidation.isValid ? '' : nameValidation.message,
                user_id: userIdValidation.isValid ? '' : userIdValidation.message,
                password: passwordValidation.isValid ? '' : passwordValidation.message,
                password_confirm: passwordValidation.isValid ? '' : passwordValidation.message
            });
            setLoading(false);
            return;
        }

        try {
            await authService.register(formData);
            
            // 회원가입 성공 시 로그인 페이지로 이동
            alert('회원가입이 완료되었습니다. 로그인해주세요.');
            navigate('/login');
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
                        회원가입
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        새로운 계정을 만들어보세요
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
                        label="사용자 이름"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        margin="normal"
                        required
                        autoFocus
                        error={!!fieldErrors.name}
                        helperText={fieldErrors.name || "실명을 입력해주세요"}
                    />
                    <TextField
                        fullWidth
                        label="사용자 ID"
                        name="user_id"
                        value={formData.user_id}
                        onChange={handleChange}
                        margin="normal"
                        required
                        error={!!fieldErrors.user_id}
                        helperText={fieldErrors.user_id || "영문자, 숫자, 언더스코어(_)만 사용 가능"}
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
                        error={!!fieldErrors.password}
                        helperText={fieldErrors.password || "최소 8자 이상 입력해주세요"}
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
                        error={!!fieldErrors.password_confirm}
                        helperText={fieldErrors.password_confirm || "비밀번호를 다시 입력해주세요"}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
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