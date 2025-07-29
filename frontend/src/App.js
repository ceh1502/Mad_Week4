import React, { useRef, useState, useEffect } from 'react';
import InitPage from './pages/InitPage.jsx';
import Signin from './pages/Signin.jsx';
import Signup from './pages/Signup.jsx';
import FriendList from './pages/FriendList.jsx';
import ChatList from './pages/ChatList.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import { FlirtoProvider } from './context/FlirtoContext';
import './App.css';

function App() {
  const signinRef = useRef(null);   
  const signupRef = useRef(null);   
  const [currentView, setCurrentView] = useState('scroll');
  const [user, setUser] = useState(null);
  const [previewView, setPreviewView] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setCurrentView('friend');
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentView('friend');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentView('scroll');
  };

  const scrollToSignin = () => {
    window.scrollTo({ top: signinRef.current.offsetTop, behavior: 'smooth' });
  };

  const scrollToSignup = () => {
    window.scrollTo({ top: signupRef.current.offsetTop, behavior: 'smooth' });
  };

  // 🔥 미리보기 모드
if (previewView === 'signin') return <Signin />;
if (previewView === 'signup') return <Signup />;
if (previewView === 'friend'||previewView==='chat') {
 return(
  <FlirtoProvider>
    <MainLayout 
    user={user} 
    onLogout={handleLogout} 
    defaultTab={previewView} />
  </FlirtoProvider>
 );
}


  // 로그인 완료 시
  if (currentView === 'friend') {
    return (
      <FlirtoProvider>
        <MainLayout user={user} onLogout={handleLogout} />
      </FlirtoProvider>
    );
  }

  return (
    <>
      <div style={{ position: 'fixed', top: 10, right: 10, zIndex: 999 }}>
        <button onClick={() => setPreviewView('signin')}>Signin UI</button>
        <button onClick={() => setPreviewView('signup')}>Signup UI</button>
        <button onClick={() => setPreviewView('friend')}>Friend UI</button>
        <button onClick={() => setPreviewView('chat')}>Chat UI</button>
        <button onClick={() => setPreviewView(null)}>Reset</button>
      </div>

      <InitPage onSigninClick={scrollToSignin} onSignupClick={scrollToSignup} />
      <div ref={signinRef}>
        <Signin onLoginSuccess={handleLoginSuccess} />
      </div>
      <div ref={signupRef}>
        <Signup 
          onSignupSuccess={scrollToSignin}
          onBackToLogin={scrollToSignin}
        />
      </div>
    </>
  );
}

export default App;
