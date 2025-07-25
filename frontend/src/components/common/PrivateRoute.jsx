import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('access_token');
    
    // 토큰이 없으면 로그인 페이지로 리다이렉트
    return token ? children : <Navigate to="/login" />;
};

export default PrivateRoute;