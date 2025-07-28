import React, { useState } from 'react';
import FloatingHearts2 from '../components/FloatingHearts2';
import '../styles/Signin.css';
import GlassPanel from '../components/GlassPanel';
import logo from '../assets/logo.png';

const Signin = ({ onLoginSuccess }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name === 'userId' ? 'username' : name]: value
        }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        
        if (!formData.username || !formData.password) {
            setError('아이디와 비밀번호를 입력해주세요.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password
                }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                if (onLoginSuccess) {
                    onLoginSuccess(data.user);
                }
            } else {
                setError(data.message || '로그인 실패');
            }
        } catch (error) {
            console.error('로그인 오류:', error);
            setError('서버 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="initPageWrapper">
            <FloatingHearts2 />
            <div className="backgroundBlur" />
            <GlassPanel width="480px">
                <img src={logo} alt="logo" className="logo" />
                <form className="SigninformGrid" onSubmit={handleLogin}>
                    <label className="Inputlabel" htmlFor="userId">ID</label>
                    <input
                        id="userId"
                        name="userId"
                        type="text"
                        className="inputField"
                        value={formData.username}
                        onChange={handleInputChange}
                        disabled={loading}
                        autoComplete="username"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                    />
                    <label className="Inputlabel" htmlFor="password">PW</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        className="inputField"
                        value={formData.password}
                        onChange={handleInputChange}
                        disabled={loading}
                        autoComplete="current-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-lpignore="true"
                    />
                </form>
                
                {error && <div style={{ color: 'red', textAlign: 'center', margin: '10px 0' }}>{error}</div>}
                
                <button 
                    className="CommonBtn" 
                    onClick={handleLogin}
                    disabled={loading}
                > 
                    {loading ? '로그인 중...' : 'Sign in'} 
                </button>
            </GlassPanel>
        </div>
    );
}
export default Signin;