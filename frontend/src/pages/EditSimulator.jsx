import React, { useState, useEffect } from 'react';
import { 
    Box, 
    TextField, 
    Button, 
    Typography, 
    Paper, 
    IconButton,
    Grid,
    Container,
    Alert,
    Snackbar,
    Chip,
    Divider,
    Card,
    CardContent,
    CircularProgress,
    Switch,
    FormControlLabel
} from '@mui/material';
import { 
    Add as AddIcon, 
    Delete as DeleteIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Api as ApiIcon,
    Code as CodeIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import simulatorService from '../services/simulatorService';
import Layout from '../components/common/Layout';

const EditSimulator = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [simulator, setSimulator] = useState(null);
    const [name, setName] = useState('');
    const [parameters, setParameters] = useState([{ key: '', value: '' }]);
    const [isActive, setIsActive] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [nameError, setNameError] = useState('');
    const [parameterErrors, setParameterErrors] = useState({});

    // 시뮬레이터 데이터 로드
    useEffect(() => {
        loadSimulator();
    }, [id]);

    const loadSimulator = async () => {
        try {
            const data = await simulatorService.getSimulator(id);
            setSimulator(data);
            setName(data.name);
            setIsActive(data.is_active);
            
            // 파라미터를 배열 형태로 변환
            const paramArray = Object.entries(data.parameters).map(([key, value]) => ({
                key,
                value: value.toString()
            }));
            setParameters(paramArray.length > 0 ? paramArray : [{ key: '', value: '' }]);
            
        } catch (error) {
            setError(error.message || '시뮬레이터를 불러올 수 없습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 이름 검증
    const validateName = (value) => {
        if (!value) {
            setNameError('시뮬레이터 이름은 필수입니다.');
            return false;
        }
        if (!/^[a-zA-Z0-9-]+$/.test(value)) {
            setNameError('영문자, 숫자, 하이픈(-)만 사용할 수 있습니다.');
            return false;
        }
        setNameError('');
        return true;
    };

    // 파라미터 키 검증
    const validateParameterKey = (key, index) => {
        const errors = { ...parameterErrors };
        
        if (key && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
            errors[`key-${index}`] = '영문자로 시작하고 영문자, 숫자, 언더스코어(_)만 사용할 수 있습니다.';
        } else {
            delete errors[`key-${index}`];
        }
        
        setParameterErrors(errors);
    };

    const handleNameChange = (e) => {
        const value = e.target.value;
        setName(value);
        validateName(value);
    };

    const addParameter = () => {
        setParameters([...parameters, { key: '', value: '' }]);
    };

    const removeParameter = (index) => {
        setParameters(parameters.filter((_, i) => i !== index));
        // 해당 인덱스의 에러도 제거
        const errors = { ...parameterErrors };
        delete errors[`key-${index}`];
        setParameterErrors(errors);
    };

    const updateParameter = (index, field, value) => {
        const updated = [...parameters];
        updated[index][field] = value;
        setParameters(updated);
        
        if (field === 'key') {
            validateParameterKey(value, index);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // 이름 검증
        if (!validateName(name)) {
            return;
        }

        // 파라미터를 객체로 변환
        const parameterObj = {};
        let hasValidParameter = false;
        
        parameters.forEach(param => {
            if (param.key && param.value) {
                parameterObj[param.key] = param.value;
                hasValidParameter = true;
            }
        });

        if (!hasValidParameter) {
            setError('최소 하나 이상의 유효한 파라미터를 입력해주세요.');
            return;
        }

        // 파라미터 키 에러가 있는지 확인
        if (Object.keys(parameterErrors).length > 0) {
            setError('파라미터 키 형식을 확인해주세요.');
            return;
        }

        setSaving(true);

        try {
            const updateData = {
                name,
                parameters: parameterObj,
                is_active: isActive
            };
            
            // 변경된 필드만 업데이트
            const changedData = {};
            if (name !== simulator.name) changedData.name = name;
            if (JSON.stringify(parameterObj) !== JSON.stringify(simulator.parameters)) {
                changedData.parameters = parameterObj;
            }
            if (isActive !== simulator.is_active) changedData.is_active = isActive;
            
            if (Object.keys(changedData).length === 0) {
                setSuccessMessage('변경사항이 없습니다.');
                setSaving(false);
                return;
            }
            
            await simulatorService.updateSimulator(id, changedData);
            
            setSuccessMessage('시뮬레이터가 성공적으로 수정되었습니다!');
            
            // 1초 후 대시보드로 이동
            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);
            
        } catch (error) {
            setError(error.message || '시뮬레이터 수정에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    // 현재 사용자 정보 가져오기
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const previewEndpoint = currentUser.user_id && name 
        ? simulatorService.getSimulatorEndpoint(currentUser.user_id, name)
        : '';

    // 예상 JSON 응답 미리보기
    const getPreviewJson = () => {
        const preview = {};
        parameters.forEach(param => {
            if (param.key && param.value) {
                preview[param.key] = param.value;
            }
        });
        return JSON.stringify(preview, null, 2);
    };

    if (loading) {
        return (
            <Layout>
                <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Container>
            </Layout>
        );
    }

    return (
        <Layout>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
                    <EditIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                    시뮬레이터 수정
                </Typography>
                
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}
                
                <Grid container spacing={3}>
                    {/* 입력 폼 영역 */}
                    <Grid item xs={12} md={7}>
                        <Paper elevation={3} sx={{ p: 4 }}>
                            <Box component="form" onSubmit={handleSubmit}>
                                <Typography variant="h6" gutterBottom>
                                    기본 정보
                                </Typography>
                                
                                <TextField
                                    fullWidth
                                    label="시뮬레이터 이름"
                                    value={name}
                                    onChange={handleNameChange}
                                    margin="normal"
                                    required
                                    error={!!nameError}
                                    helperText={nameError || "영문, 숫자, 하이픈(-)만 사용 가능합니다"}
                                    inputProps={{
                                        pattern: "[a-zA-Z0-9-]+",
                                        maxLength: 255
                                    }}
                                />
                                
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={isActive}
                                            onChange={(e) => setIsActive(e.target.checked)}
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            활성화 상태
                                            <Chip 
                                                label={isActive ? "활성" : "비활성"} 
                                                color={isActive ? "success" : "default"}
                                                size="small"
                                            />
                                        </Box>
                                    }
                                    sx={{ mt: 2 }}
                                />
                                
                                <Divider sx={{ my: 3 }} />
                                
                                <Typography variant="h6" gutterBottom>
                                    파라미터 설정
                                </Typography>
                                
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    API 응답으로 반환할 JSON 데이터의 키-값 쌍을 설정하세요.
                                </Typography>
                                
                                {parameters.map((param, index) => (
                                    <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                                        <Grid item xs={5}>
                                            <TextField
                                                fullWidth
                                                label="Key"
                                                value={param.key}
                                                onChange={(e) => updateParameter(index, 'key', e.target.value)}
                                                placeholder="예: temperature"
                                                error={!!parameterErrors[`key-${index}`]}
                                                helperText={parameterErrors[`key-${index}`]}
                                            />
                                        </Grid>
                                        <Grid item xs={5}>
                                            <TextField
                                                fullWidth
                                                label="Value"
                                                value={param.value}
                                                onChange={(e) => updateParameter(index, 'value', e.target.value)}
                                                placeholder="예: 25"
                                            />
                                        </Grid>
                                        <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center' }}>
                                            <IconButton 
                                                onClick={() => removeParameter(index)}
                                                disabled={parameters.length === 1}
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                ))}
                                
                                <Button
                                    startIcon={<AddIcon />}
                                    onClick={addParameter}
                                    sx={{ mb: 3 }}
                                    variant="outlined"
                                    size="small"
                                >
                                    파라미터 추가
                                </Button>
                                
                                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => navigate('/dashboard')}
                                        startIcon={<CancelIcon />}
                                    >
                                        취소
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={saving}
                                        startIcon={<SaveIcon />}
                                    >
                                        {saving ? '저장 중...' : '변경사항 저장'}
                                    </Button>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                    
                    {/* 미리보기 영역 */}
                    <Grid item xs={12} md={5}>
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    <CodeIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                                    API 엔드포인트
                                </Typography>
                                <TextField
                                    fullWidth
                                    value={previewEndpoint}
                                    margin="normal"
                                    InputProps={{
                                        readOnly: true,
                                    }}
                                    size="small"
                                />
                                <Typography variant="caption" color="text.secondary">
                                    {isActive 
                                        ? 'GET 요청으로 아래 JSON 데이터를 받을 수 있습니다.'
                                        : '비활성화 상태에서는 비활성화 메시지가 반환됩니다.'}
                                </Typography>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    JSON 응답 미리보기
                                </Typography>
                                {isActive ? (
                                    <Box
                                        sx={{
                                            bgcolor: (theme) => theme.palette.mode === 'dark' 
                                                ? 'grey.900' 
                                                : 'grey.100',
                                            color: (theme) => theme.palette.mode === 'dark' 
                                                ? 'grey.100' 
                                                : 'grey.900',
                                            p: 2,
                                            borderRadius: 1,
                                            fontFamily: 'monospace',
                                            fontSize: '0.875rem',
                                            overflow: 'auto',
                                            maxHeight: 300,
                                            border: (theme) => `1px solid ${theme.palette.divider}`
                                        }}
                                    >
                                        <pre style={{ margin: 0, color: 'inherit' }}>
                                            {getPreviewJson() || '{}'}
                                        </pre>
                                    </Box>
                                ) : (
                                    <Box
                                        sx={{
                                            bgcolor: 'error.light',
                                            p: 2,
                                            borderRadius: 1,
                                            fontFamily: 'monospace',
                                            fontSize: '0.875rem',
                                        }}
                                    >
                                        <pre style={{ margin: 0 }}>
{`{
  "message": "해당 시뮬레이터는 비활성화 상태 입니다."
}`}
                                        </pre>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                        
                        {/* 시뮬레이터 정보 */}
                        <Card sx={{ mt: 3 }}>
                            <CardContent>
                                <Typography variant="subtitle2" color="text.secondary">
                                    생성일: {new Date(simulator?.created_at).toLocaleString('ko-KR')}
                                </Typography>
                                <Typography variant="subtitle2" color="text.secondary">
                                    수정일: {new Date(simulator?.updated_at).toLocaleString('ko-KR')}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
                
                {/* 성공 메시지 스낵바 */}
                <Snackbar
                    open={!!successMessage}
                    autoHideDuration={1000}
                    onClose={() => setSuccessMessage('')}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert onClose={() => setSuccessMessage('')} severity="success">
                        {successMessage}
                    </Alert>
                </Snackbar>
            </Container>
        </Layout>
    );
};

export default EditSimulator;