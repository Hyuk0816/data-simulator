import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    IconButton,
    Container,
    Alert,
    Snackbar,
    FormHelperText,
    Chip,
    Divider,
    Card,
    CardContent,
    Checkbox,
    FormControlLabel,
    Grid,
    CircularProgress,
    Switch
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Api as ApiIcon,
    Code as CodeIcon,
    Upload as UploadIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import simulatorService from '../../services/simulatorService';
import { simulatorAPI } from '../../services/api';
import Layout from '../common/Layout';
import FileUploadModal from './FileUploadModal';

const SimulatorForm = ({ mode = 'create' }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // Common state
    const [name, setName] = useState('');
    const [parameters, setParameters] = useState([{
        key: '',
        value: '',
        isRandom: false,
        type: 'integer',
        min: '',
        max: ''
    }]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(mode === 'edit');
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [nameError, setNameError] = useState('');
    const [parameterErrors, setParameterErrors] = useState({});
    
    // Edit mode specific state
    const [simulator, setSimulator] = useState(null);
    const [isActive, setIsActive] = useState(true);
    
    // Create mode specific state
    const [fileUploadModalOpen, setFileUploadModalOpen] = useState(false);

    // Load simulator data for edit mode
    useEffect(() => {
        if (mode === 'edit' && id) {
            loadSimulator();
        } else {
            setLoading(false);
        }
    }, [mode, id]);

    const loadSimulator = async () => {
        try {
            const data = await simulatorService.getSimulator(id);
            setSimulator(data);
            setName(data.name);
            setIsActive(data.is_active);
            
            // Convert parameters to array format
            const paramArray = Object.entries(data.parameters).map(([key, value]) => {
                const config = data.parameter_config?.[key] || {};
                return {
                    key,
                    value: config.is_random ? (value || '') : (value !== null ? value.toString() : ''),
                    isRandom: config.is_random || false,
                    type: config.type || 'integer',
                    min: config.min?.toString() || '',
                    max: config.max?.toString() || ''
                };
            });
            setParameters(paramArray.length > 0 ? paramArray : [{
                key: '',
                value: '',
                isRandom: false,
                type: 'integer',
                min: '',
                max: ''
            }]);
            
        } catch (error) {
            setError(error.message || '시뮬레이터를 불러올 수 없습니다.');
        } finally {
            setLoading(false);
        }
    };

    // Validation functions
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

    const validateParameterKey = (key, index) => {
        const errors = { ...parameterErrors };

        if (key && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
            errors[`key-${index}`] = '영문자로 시작하고 영문자, 숫자, 언더스코어(_)만 사용할 수 있습니다.';
        } else {
            delete errors[`key-${index}`];
        }

        setParameterErrors(errors);
    };

    // Event handlers
    const handleNameChange = (e) => {
        const value = e.target.value;
        setName(value);
        validateName(value);
    };

    const addParameter = () => {
        setParameters([...parameters, {
            key: '',
            value: '',
            isRandom: false,
            type: 'integer',
            min: '',
            max: ''
        }]);
    };

    const removeParameter = (index) => {
        setParameters(parameters.filter((_, i) => i !== index));
        const errors = { ...parameterErrors };
        delete errors[`key-${index}`];
        setParameterErrors(errors);
    };

    const updateParameter = (index, field, value) => {
        const updated = [...parameters];
        updated[index][field] = value;

        // Reset min/max when isRandom becomes false
        if (field === 'isRandom' && !value) {
            updated[index].min = '';
            updated[index].max = '';
        }

        setParameters(updated);

        if (field === 'key') {
            validateParameterKey(value, index);
        }
    };

    // File upload handlers (create mode only)
    const handleFileUpload = async (file) => {
        const headers = await simulatorAPI.uploadFile(file);
        return headers;
    };

    const handleFileUploadComplete = (columns) => {
        if (columns && columns.length > 0) {
            const newParameters = columns.map(column => ({
                key: column,
                value: '',
                isRandom: false,
                type: 'integer',
                min: '',
                max: ''
            }));

            setParameters(newParameters);
            setSuccessMessage(`${columns.length}개의 파라미터가 파일에서 추출되었습니다.`);
        }
        setFileUploadModalOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Name validation
        if (!validateName(name)) {
            return;
        }

        // Convert parameters to object
        const parameterObj = {};
        const parameterConfig = {};
        let hasValidParameter = false;

        parameters.forEach(param => {
            if (param.key && (param.value || param.isRandom)) {
                // Set parameter value
                if (!param.isRandom) {
                    parameterObj[param.key] = param.value;
                } else {
                    parameterObj[param.key] = param.value || null;
                }

                // Set parameter configuration
                parameterConfig[param.key] = {
                    is_random: param.isRandom,
                    type: param.isRandom ? param.type : null,
                    min: param.isRandom && param.min ? parseFloat(param.min) : null,
                    max: param.isRandom && param.max ? parseFloat(param.max) : null
                };

                hasValidParameter = true;
            }
        });

        if (!hasValidParameter) {
            setError('최소 하나 이상의 유효한 파라미터를 입력해주세요.');
            return;
        }

        // Random parameter validation
        for (const param of parameters) {
            if (param.isRandom && param.key) {
                if (!param.min || !param.max) {
                    setError('랜덤 설정된 파라미터는 최소값과 최대값을 입력해야 합니다.');
                    return;
                }
                if (parseFloat(param.min) >= parseFloat(param.max)) {
                    setError('최소값은 최대값보다 작아야 합니다.');
                    return;
                }
            }
        }

        // Parameter key error check
        if (Object.keys(parameterErrors).length > 0) {
            setError('파라미터 키 형식을 확인해주세요.');
            return;
        }

        setSaving(true);

        try {
            if (mode === 'create') {
                await simulatorService.createSimulator({
                    name,
                    parameters: parameterObj,
                    parameter_config: parameterConfig,
                    is_active: true
                });
                setSuccessMessage('시뮬레이터가 성공적으로 생성되었습니다!');
            } else {
                // Edit mode - only send changed data
                const updateData = {};
                if (name !== simulator.name) updateData.name = name;
                if (JSON.stringify(parameterObj) !== JSON.stringify(simulator.parameters)) {
                    updateData.parameters = parameterObj;
                    updateData.parameter_config = parameterConfig;
                }
                if (isActive !== simulator.is_active) updateData.is_active = isActive;
                
                if (Object.keys(updateData).length === 0) {
                    setSuccessMessage('변경사항이 없습니다.');
                    setSaving(false);
                    return;
                }
                
                await simulatorService.updateSimulator(id, updateData);
                setSuccessMessage('시뮬레이터가 성공적으로 수정되었습니다!');
            }

            // Navigate to dashboard after 1 second
            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);

        } catch (error) {
            setError(error.message || `시뮬레이터 ${mode === 'create' ? '생성' : '수정'}에 실패했습니다.`);
        } finally {
            setSaving(false);
        }
    };

    // Preview functions
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const previewEndpoint = currentUser.user_id && name
        ? simulatorService.getSimulatorEndpoint(currentUser.user_id, name)
        : '';

    const getPreviewJson = () => {
        const preview = {};
        parameters.forEach(param => {
            if (param.key) {
                if (param.isRandom) {
                    preview[param.key] = `랜덤 (${param.min || '?'}~${param.max || '?'})`;
                } else if (param.value) {
                    preview[param.key] = param.value;
                }
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
                    {mode === 'create' ? (
                        <>
                            <ApiIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                            새 시뮬레이터 만들기
                        </>
                    ) : (
                        <>
                            <EditIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                            시뮬레이터 수정
                        </>
                    )}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                    {/* Form Area */}
                    <Box sx={{ flex: '1 1 60%' }}>
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

                                {/* Edit mode - show activation toggle */}
                                {mode === 'edit' && (
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
                                )}

                                <Divider sx={{ my: 3 }} />

                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="h6" gutterBottom>
                                        파라미터 설정
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        API 응답으로 반환할 JSON 데이터의 키-값 쌍을 설정하세요.
                                    </Typography>
                                    
                                    {/* File upload button - only in create mode */}
                                    {mode === 'create' && (
                                        <Button
                                            variant="outlined"
                                            startIcon={<UploadIcon />}
                                            onClick={() => setFileUploadModalOpen(true)}
                                            sx={{ mb: 2 }}
                                        >
                                            CSV/Excel 파일에서 가져오기
                                        </Button>
                                    )}
                                </Box>

                                {/* Parameter input area with scroll for 5+ items */}
                                <Box
                                    sx={{
                                        maxHeight: parameters.length >= 5 ? 400 : 'none',
                                        overflowY: parameters.length >= 5 ? 'auto' : 'visible',
                                        pr: parameters.length >= 5 ? 1 : 0,
                                        '&::-webkit-scrollbar': {
                                            width: '8px',
                                        },
                                        '&::-webkit-scrollbar-track': {
                                            background: '#f1f1f1',
                                            borderRadius: '4px',
                                        },
                                        '&::-webkit-scrollbar-thumb': {
                                            background: '#c1c1c1',
                                            borderRadius: '4px',
                                        },
                                        '&::-webkit-scrollbar-thumb:hover': {
                                            background: '#a8a8a8',
                                        },
                                    }}
                                >
                                    {parameters.map((param, index) => (
                                        <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                                            <Grid item xs={param.isRandom ? 3.5 : 5}>
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
                                            {!param.isRandom && (
                                                <Grid item xs={5}>
                                                    <TextField
                                                        fullWidth
                                                        label="Value"
                                                        value={param.value}
                                                        onChange={(e) => updateParameter(index, 'value', e.target.value)}
                                                        placeholder="예: 25"
                                                    />
                                                </Grid>
                                            )}
                                            {param.isRandom && (
                                                <>
                                                    <Grid item xs={1.25}>
                                                        <TextField
                                                            label="Min"
                                                            type="number"
                                                            value={param.min}
                                                            onChange={(e) => updateParameter(index, 'min', e.target.value)}
                                                            size="small"
                                                            sx={{ width: '100px' }}
                                                            style={{ marginTop: '5px'}}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={1.25}>
                                                        <TextField
                                                            label="Max"
                                                            type="number"
                                                            value={param.max}
                                                            onChange={(e) => updateParameter(index, 'max', e.target.value)}
                                                            size="small"
                                                            sx={{ width: '100px' }}
                                                            style={{ marginTop: '5px'}}
                                                        />
                                                    </Grid>
                                                </>
                                            )}
                                            <Grid item xs={1.5} sx={{ display: 'flex', alignItems: 'center' }}>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={param.isRandom}
                                                            onChange={(e) => updateParameter(index, 'isRandom', e.target.checked)}
                                                            size="small"
                                                        />
                                                    }
                                                    label="Random"
                                                    sx={{ mr: 0, '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                                                />
                                            </Grid>
                                            <Grid item xs={0.5} sx={{ display: 'flex', alignItems: 'center' }}>
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
                                </Box>

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
                                        {saving 
                                            ? `${mode === 'create' ? '생성' : '저장'} 중...` 
                                            : `시뮬레이터 ${mode === 'create' ? '생성' : '변경사항 저장'}`
                                        }
                                    </Button>
                                </Box>
                            </Box>
                        </Paper>
                    </Box>

                    {/* Preview Area */}
                    <Box sx={{ flex: '1 1 40%', position: 'sticky', top: 16, alignSelf: 'flex-start' }}>
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    <CodeIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                                    API 엔드포인트 미리보기
                                </Typography>
                                {previewEndpoint ? (
                                    <>
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
                                            {mode === 'edit' && !isActive 
                                                ? '비활성화 상태에서는 비활성화 메시지가 반환됩니다.'
                                                : 'GET 요청으로 아래 JSON 데이터를 받을 수 있습니다.'
                                            }
                                        </Typography>
                                    </>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        시뮬레이터 이름을 입력하면 엔드포인트가 표시됩니다.
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    JSON 응답 미리보기
                                </Typography>
                                {mode === 'edit' && !isActive ? (
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
                                ) : (
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
                                )}
                            </CardContent>
                        </Card>

                        {/* Edit mode - show simulator info */}
                        {mode === 'edit' && simulator && (
                            <Card sx={{ mt: 3 }}>
                                <CardContent>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        생성일: {new Date(simulator.created_at).toLocaleString('ko-KR')}
                                    </Typography>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        수정일: {new Date(simulator.updated_at).toLocaleString('ko-KR')}
                                    </Typography>
                                </CardContent>
                            </Card>
                        )}
                    </Box>
                </Box>

                {/* Success message snackbar */}
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

                {/* File upload modal - only in create mode */}
                {mode === 'create' && (
                    <FileUploadModal
                        open={fileUploadModalOpen}
                        onClose={handleFileUploadComplete}
                        onFileUpload={handleFileUpload}
                    />
                )}
            </Container>
        </Layout>
    );
};

export default SimulatorForm;