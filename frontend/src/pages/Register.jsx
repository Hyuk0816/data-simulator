import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Link, Alert, CircularProgress, InputAdornment, IconButton } from '@mui/material';
import { Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import userService from '../services/userService';
import { authAPI } from '../services/api';

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
    const [isUserIdChecked, setIsUserIdChecked] = useState(false);
    const [isUserIdAvailable, setIsUserIdAvailable] = useState(false);
    const [checkingUserId, setCheckingUserId] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        setError('');
        
        // user_id가 변경되면 중복확인 초기화
        if (name === 'user_id') {
            setIsUserIdChecked(false);
            setIsUserIdAvailable(false);
        }
        
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
                    // 비밀번호 길이만 검증
                    if (value.length < 8) {
                        validationResult = { isValid: false, message: '비밀번호는 최소 8자 이상이어야 합니다.' };
                    }
                    // 비밀번호 확인 필드가 입력되어 있으면 일치 여부도 검증
                    if (formData.password_confirm.length > 0) {
                        validationResult = userService.validatePassword(value, formData.password_confirm);
                    }
                }
                break;
            case 'password_confirm':
                if (value.length > 0 && formData.password.length > 0) {
                    // 비밀번호 확인 필드가 입력되고 비밀번호도 입력되어 있을 때만 검증
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

    const handleCheckUserId = async () => {
        const validationResult = userService.validateUserId(formData.user_id);
        if (!validationResult.isValid) {
            setFieldErrors(prev => ({ ...prev, user_id: validationResult.message }));
            return;
        }
        
        setCheckingUserId(true);
        try {
            const response = await authAPI.checkUserId(formData.user_id);
            setIsUserIdChecked(true);
            setIsUserIdAvailable(response.data.available);
            setFieldErrors(prev => ({ 
                ...prev, 
                user_id: response.data.available ? '' : response.data.message 
            }));
        } catch (error) {
            setFieldErrors(prev => ({ 
                ...prev, 
                user_id: error.message || '중복 확인 중 오류가 발생했습니다.' 
            }));
        } finally {
            setCheckingUserId(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // 중복확인 여부 체크
        if (!isUserIdChecked || !isUserIdAvailable) {
            setError('사용자 ID 중복확인을 해주세요.');
            setLoading(false);
            return;
        }

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
                        error={!!fieldErrors.user_id && !isUserIdAvailable}
                        helperText={
                            fieldErrors.user_id ? 
                            fieldErrors.user_id : 
                            (isUserIdChecked && isUserIdAvailable ? 
                                "사용 가능한 ID입니다 ✓" : 
                                "영문자, 숫자, 언더스코어(_)만 사용 가능")
                        }
                        FormHelperTextProps={{
                            sx: {
                                color: isUserIdChecked && isUserIdAvailable && !fieldErrors.user_id ? 
                                       'success.main' : 
                                       undefined
                            }
                        }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    {isUserIdChecked && (
                                        isUserIdAvailable ? 
                                        <CheckIcon color="success" /> : 
                                        <CloseIcon color="error" />
                                    )}
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={handleCheckUserId}
                                        disabled={!formData.user_id || checkingUserId}
                                        sx={{ ml: 1 }}
                                    >
                                        {checkingUserId ? 
                                            <CircularProgress size={16} /> : 
                                            '중복확인'
                                        }
                                    </Button>
                                </InputAdornment>
                            ),
                        }}
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
                        helperText={
                            fieldErrors.password_confirm ? 
                            fieldErrors.password_confirm : 
                            (formData.password_confirm.length > 0 && formData.password === formData.password_confirm ? 
                                "비밀번호가 일치합니다 ✓" : 
                                "비밀번호를 다시 입력해주세요")
                        }
                        FormHelperTextProps={{
                            sx: {
                                color: formData.password_confirm.length > 0 && 
                                       formData.password === formData.password_confirm && 
                                       !fieldErrors.password_confirm ? 
                                       'success.main' : 
                                       undefined
                            }
                        }}
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