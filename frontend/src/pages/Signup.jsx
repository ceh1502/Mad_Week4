import React, { useState } from 'react';
import FloatingHearts from '../components/FloatingHearts';
import '../styles/Signup.css';
import GlassPanel from '../components/GlassPanel';
import logo from '../assets/logo.png';

const Signup = ({ onSignupSuccess, onBackToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    console.log('Signup input change:', id, value); // 디버깅용
    if (id === 'name') {
      setFormData(prev => ({ ...prev, name: value }));
    } else if (id === 'id') {
      setFormData(prev => ({ ...prev, username: value }));
    } else if (id === 'pw') {
      setFormData(prev => ({ ...prev, password: value }));
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.username || !formData.password) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const requestData = {
        name: formData.name,
        username: formData.username,
        password: formData.password
      };
      
      console.log('회원가입 요청 데이터:', requestData);
      console.log('API URL:', process.env.REACT_APP_API_URL);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      console.log('응답 상태:', response.status);

      const data = await response.json();

      if (response.ok) {
        alert('회원가입이 완료되었습니다!');
        if (onSignupSuccess) {
          onSignupSuccess();
        }
      } else {
        setError(data.message || '회원가입 실패');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="initPageWrapper">
      <FloatingHearts />
      <div className="backgroundBlur" />
      <GlassPanel width="800px" height="400px">
        <img src={logo} alt="logo" className="logo" />
        <div className="SignupContent">
        <form onSubmit={handleSignup}>
          <div className="SignupformGrid">
            <div className="SignupformRow">
              <label htmlFor="name">Name</label>
              <input 
                type="text" 
                id="name" 
                value={formData.name}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
            <div className="SignupformRow">
              <label htmlFor="id">ID</label>
              <input 
                type="text" 
                id="id" 
                value={formData.username}
                onChange={handleInputChange}
                disabled={loading}
                autoComplete="username"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              </div>
              <div className="SignupformRow">
              <label htmlFor="pw">PW</label>
              <input 
                type="password" 
                id="pw" 
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-lpignore="true"
              />
              </div>
          </div>
          
          {error && <div style={{ color: 'red', textAlign: 'center', margin: '10px 0' }}>{error}</div>}
          
            <button 
              type="submit" 
              className="SignupCommonBtn"
              disabled={loading}
            >
              {loading ? '가입 중...' : 'Sign Up'}
            </button>
        </form>
        </div>
      </GlassPanel>
    </div>
  );
};

export default Signup;
