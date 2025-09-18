import React from 'react';
import { Container, Box } from '@mui/material';
import Layout from '../components/common/Layout';
import FailureScenarioList from '../components/failure/FailureScenarioList';

const FailureScenarios = ({ darkMode, setDarkMode }) => {
    return (
        <Layout darkMode={darkMode} setDarkMode={setDarkMode}>
            <Container maxWidth="lg">
                <Box sx={{ py: 4 }}>
                    <FailureScenarioList />
                </Box>
            </Container>
        </Layout>
    );
};

export default FailureScenarios;