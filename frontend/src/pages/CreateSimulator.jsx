import React, { useState } from 'react';
import { 
    Box, 
    TextField, 
    Button, 
    Typography, 
    Paper, 
    IconButton,
    Grid,
    Container,
    AppBar,
    Toolbar,
    Alert
} from '@mui/material';
import { 
    Add as AddIcon, 
    Delete as DeleteIcon,
    ArrowBack as ArrowBackIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CreateSimulator = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [parameters, setParameters] = useState([{ key: '', value: '' }]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const addParameter = () => {
        setParameters([...parameters, { key: '', value: '' }]);
    };

    const removeParameter = (index) => {
        setParameters(parameters.filter((_, i) => i !== index));
    };

    const updateParameter = (index, field, value) => {
        const updated = [...parameters];
        updated[index][field] = value;
        setParameters(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // 파라미터를 객체로 변환
        const parameterObj = {};
        parameters.forEach(param => {
            if (param.key && param.value) {
                parameterObj[param.key] = param.value;
            }
        });

        if (Object.keys(parameterObj).length === 0) {
            setError('최소 하나 이상의 파라미터를 입력해주세요.');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:8000/api/simulators',
                {
                    name,
                    parameters: parameterObj
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            // 성공 시 대시보드로 이동
            navigate('/dashboard');
        } catch (error) {
            setError(
                error.response?.data?.detail || 
                '시뮬레이터 생성에 실패했습니다. 다시 시도해주세요.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={() => navigate('/dashboard')}
                        sx={{ mr: 2 }}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        시뮬레이터 생성
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                        새 시뮬레이터 만들기
                    </Typography>
                    
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    
                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="시뮬레이터 이름"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            margin="normal"
                            required
                            helperText="영문, 숫자, 언더스코어(_)만 사용 가능합니다"
                        />
                        
                        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
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
                        >
                            파라미터 추가
                        </Button>
                        
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/dashboard')}
                            >
                                취소
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={loading}
                            >
                                {loading ? '생성 중...' : '시뮬레이터 생성'}
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default CreateSimulator;