import React, { useState } from 'react';
import FloatingHearts2 from '../components/FloatingHearts2';
import '../styles/Signin.css';
import GlassPanel from '../components/GlassPanel';
import logo from '../assets/logo.png';

const Signin = ({ onLoginSuccess, onSignupClick }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
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

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                onLoginSuccess(data.user);
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Login failed.');
            }
        } catch (error) {
            setError('Server connection failed.');
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
                <form className="formGrid" onSubmit={handleSubmit}>
                    <label htmlFor="username">ID</label>
                    <input
                        id="username"
                        name="username"
                        type="text"
                        className="inputField"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                    <label htmlFor="password">PW</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        className="inputField"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </form>
                {error && <div className="error-message">{error}</div>}
                <button 
                    type="submit" 
                    className="CommonBtn" 
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? 'Signing in...' : 'Sign in'}
                </button>
                <button 
                    type="button" 
                    className="CommonBtn secondary" 
                    onClick={onSignupClick}
                >
                    Sign up
                </button>
            </GlassPanel>
        </div>
    );
}
export default Signin;