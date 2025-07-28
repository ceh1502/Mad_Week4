import React, { useState } from 'react';
import FloatingHearts2 from '../components/FloatingHearts2';
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
    setFormData(prev => ({
      ...prev,
      [id === 'id' ? 'username' : id]: value
    }));
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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/register`, {
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
      <FloatingHearts2 />
      <div className="backgroundBlur" />
      <GlassPanel width="480px">
        <img src={logo} alt="logo" className="logo" />
        <div className="SignupContent">
        <div className="photoUpload">
          <div className="photoCircle" />
          <button className="uploadBtn">사진 업로드</button>
        </div>

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
              />
            </div>
          </div>
          
          {error && <div style={{ color: 'red', textAlign: 'center', margin: '10px 0' }}>{error}</div>}
          
          <div className="btnRow">
            <button 
              type="submit" 
              className="CommonBtn"
              disabled={loading}
            >
              {loading ? '가입 중...' : 'Sign Up'}
            </button>
            {onBackToLogin && (
              <button 
                type="button" 
                className="CommonBtn" 
                onClick={onBackToLogin}
                style={{ marginTop: '10px', background: 'rgba(255,255,255,0.1)' }}
              >
                로그인으로 돌아가기
              </button>
            )}
          </div>
        </form>
        </div>
      </GlassPanel>
    </div>
  );
};

export default Signup;
