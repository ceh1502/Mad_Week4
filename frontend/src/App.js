import React, { useState, useEffect } from 'react';
import InitPage from './pages/InitPage.jsx';
import Signin from './pages/Signin.jsx';
import Signup from './pages/Signup.jsx';
import ChatPage from './pages/ChatPage.jsx';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('init');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      setCurrentView('chat');
    }
  }, []);

  const handleSigninClick = () => {
    setCurrentView('signin');
  };

  const handleSignupClick = () => {
    setCurrentView('signup');
  };

  const handleBackToLogin = () => {
    setCurrentView('signin');
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentView('chat');
  };

  const handleSignupSuccess = () => {
    setCurrentView('signin');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentView('init');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'init':
        return <InitPage onSigninClick={handleSigninClick} />;
      case 'signin':
        return (
          <Signin 
            onLoginSuccess={handleLoginSuccess}
            onSignupClick={handleSignupClick}
          />
        );
      case 'signup':
        return (
          <Signup 
            onSignupSuccess={handleSignupSuccess}
            onBackToLogin={handleBackToLogin}
          />
        );
      case 'chat':
        return <ChatPage user={user} onLogout={handleLogout} />;
      default:
        return <InitPage onSigninClick={handleSigninClick} />;
    }
  };

  return <>{renderCurrentView()}</>;
}

export default App;
