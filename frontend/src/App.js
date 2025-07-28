import React, { useRef, useState, useEffect } from 'react';
import InitPage from './pages/InitPage.jsx';
import Signin from './pages/Signin.jsx';
import Signup from './pages/Signup.jsx';
import ChatPage from './pages/ChatPage.jsx';
import './App.css';

function App() {
  const signinRef = useRef(null);   
  const signupRef = useRef(null);   
  const [currentView, setCurrentView] = useState('scroll');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setCurrentView('chat');
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentView('chat');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentView('scroll');
  };

  const scrollToSignin = () => {
    const targetY = signinRef.current.offsetTop;
    const duration = 1000;
    const startY = window.scrollY;
    const diff = targetY - startY;
    const startTime = performance.now();

    const easeInOutCubic = t =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animateScroll = currentTime => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeInOutCubic(progress);
      window.scrollTo(0, startY + diff * ease);

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  const scrollToSignup = () => {
    const targetY = signupRef.current.offsetTop;
    const duration = 1000;
    const startY = window.scrollY;
    const diff = targetY - startY;
    const startTime = performance.now();

    const easeInOutCubic = t =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animateScroll = currentTime => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeInOutCubic(progress);
      window.scrollTo(0, startY + diff * ease);

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  if (currentView === 'chat') {
    return <ChatPage user={user} onLogout={handleLogout} />;
  }

  return (
    <>
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
