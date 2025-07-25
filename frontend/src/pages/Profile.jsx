import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    Alert,
    CircularProgress,
    Grid,
    Divider,
    Card,
    CardContent
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import userService from '../services/userService';

const Profile = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        user_id: '',
        password: '',
        password_confirm: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [fieldErrors, setFieldErrors] = useState({});

    // 사용자 정보 로딩
    useEffect(() => {
        const loadUserInfo = async () => {
            try {
                // 인증 상태 확인
                const user = await authService.checkAuthStatus();
                if (!user) {
                    navigate('/login');
                    return;
                }

                setCurrentUser(user);
                setFormData({
                    name: user.name,
                    user_id: user.user_id,
                    password: '',
                    password_confirm: ''
                });
            } catch (error) {
                console.error('사용자 정보 로딩 실패:', error);
                navigate('/login');
            } finally {
                setPageLoading(false);
            }
        };

        loadUserInfo();
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        setError('');
        setSuccess('');
        
        // 실시간 필드 검증
        validateField(name, value);
    };

    const validateField = (fieldName, value) => {
        let validationResult = { isValid: true, message: '' };
        
        switch (fieldName) {
            case 'name':
                if (value) {
                    validationResult = userService.validateName(value);
                }
                break;
            case 'user_id':
                if (value) {
                    validationResult = userService.validateUserId(value);
                }
                break;
            case 'password':
                if (value.length > 0) {
                    validationResult = userService.validatePassword(value, formData.password_confirm);
                }
                break;
            case 'password_confirm':
                if (value.length > 0 || formData.password.length > 0) {
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
        setSuccess('');

        try {
            // 변경된 필드만 추출
            const updatedData = {};
            
            if (formData.name !== currentUser.name) {
                const nameValidation = userService.validateName(formData.name);
                if (!nameValidation.isValid) {
                    setFieldErrors(prev => ({ ...prev, name: nameValidation.message }));
                    setLoading(false);
                    return;
                }
                updatedData.name = formData.name;
            }

            if (formData.user_id !== currentUser.user_id) {
                const userIdValidation = userService.validateUserId(formData.user_id);
                if (!userIdValidation.isValid) {
                    setFieldErrors(prev => ({ ...prev, user_id: userIdValidation.message }));
                    setLoading(false);
                    return;
                }
                updatedData.user_id = formData.user_id;
            }

            if (formData.password) {
                const passwordValidation = userService.validatePassword(formData.password, formData.password_confirm);
                if (!passwordValidation.isValid) {
                    setFieldErrors(prev => ({ 
                        ...prev, 
                        password: passwordValidation.message,
                        password_confirm: passwordValidation.message
                    }));
                    setLoading(false);
                    return;
                }
                updatedData.password = formData.password;
                updatedData.password_confirm = formData.password_confirm;
            }

            // 변경사항이 없는 경우
            if (Object.keys(updatedData).length === 0) {
                setError('변경된 내용이 없습니다.');
                setLoading(false);
                return;
            }

            // 사용자 정보 업데이트
            const updatedUser = await userService.updateUser(currentUser.id, updatedData);
            
            // 현재 사용자 정보 업데이트
            setCurrentUser(updatedUser);
            authService.setUser(updatedUser);
            
            // 비밀번호 필드 초기화
            setFormData(prev => ({
                ...prev,
                password: '',
                password_confirm: ''
            }));

            setSuccess('사용자 정보가 성공적으로 업데이트되었습니다.');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
    };

    if (pageLoading) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                backgroundColor: '#f5f5f5',
                py: 4
            }}
        >
            <Grid container justifyContent="center" spacing={3}>
                <Grid item xs={12} md={8} lg={6}>
                    {/* 현재 사용자 정보 카드 */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h5" component="h1" gutterBottom>
                                프로필 정보
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                현재 로그인: {currentUser?.name} ({currentUser?.user_id})
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                가입일: {new Date(currentUser?.created_at).toLocaleDateString('ko-KR')}
                            </Typography>
                        </CardContent>
                    </Card>

                    {/* 정보 수정 폼 */}
                    <Paper elevation={3} sx={{ p: 4 }}>
                        <Typography variant="h5" component="h2" gutterBottom>
                            정보 수정
                        </Typography>
                        
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}
                        
                        {success && (
                            <Alert severity="success" sx={{ mb: 2 }}>
                                {success}
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
                                error={!!fieldErrors.name}
                                helperText={fieldErrors.name || "새로운 이름을 입력하세요"}
                            />
                            
                            <TextField
                                fullWidth
                                label="사용자 ID"
                                name="user_id"
                                value={formData.user_id}
                                onChange={handleChange}
                                margin="normal"
                                error={!!fieldErrors.user_id}
                                helperText={fieldErrors.user_id || "새로운 사용자 ID를 입력하세요"}
                            />

                            <Divider sx={{ my: 3 }}>
                                <Typography variant="body2" color="text.secondary">
                                    비밀번호 변경 (선택사항)
                                </Typography>
                            </Divider>
                            
                            <TextField
                                fullWidth
                                label="새 비밀번호"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                margin="normal"
                                error={!!fieldErrors.password}
                                helperText={fieldErrors.password || "변경하지 않으려면 비워두세요"}
                            />
                            
                            <TextField
                                fullWidth
                                label="새 비밀번호 확인"
                                name="password_confirm"
                                type="password"
                                value={formData.password_confirm}
                                onChange={handleChange}
                                margin="normal"
                                error={!!fieldErrors.password_confirm}
                                helperText={fieldErrors.password_confirm || "새 비밀번호를 다시 입력하세요"}
                            />
                            
                            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={loading}
                                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                                    sx={{ flex: 1 }}
                                >
                                    {loading ? '업데이트 중...' : '정보 업데이트'}
                                </Button>
                                
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate('/dashboard')}
                                    sx={{ flex: 1 }}
                                >
                                    대시보드로 돌아가기
                                </Button>
                            </Box>
                            
                            <Divider sx={{ my: 3 }} />
                            
                            <Button
                                variant="text"
                                color="error"
                                onClick={handleLogout}
                                fullWidth
                            >
                                로그아웃
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Profile;