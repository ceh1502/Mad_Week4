import React, { useRef, useState, useEffect } from 'react';
import InitPage from './pages/InitPage.jsx';
import Signin from './pages/Signin.jsx';
import Signup from './pages/Signup.jsx';
import ChatList from './pages/ChatList.jsx';
import FriendList from './pages/FriendList.jsx';
import Settings from './pages/Settings.jsx';
import FloatingHearts from './components/FloatingHearts';
import GlassPanel from './components/GlassPanel';
import { FaSearch } from 'react-icons/fa';
import { FlirtoProvider, useFlirto } from './context/FlirtoContext';
import './App.css';

function MainLayout({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('friend');
  const { isFlirtoOn } = useFlirto();

  const renderMainPanel = () => {
    if (!isFlirtoOn) {
      return <div className="flirtoOffMessage">Flirto를 켜보세요!</div>;
    }
    if (activeTab === 'friend') return <FriendList />;
    if (activeTab === 'chat') return <ChatList />;
    if (activeTab === 'settings') return <Settings />;
  };

  return (
    <div className="FriendPageWrapper">
      <FloatingHearts />
      <div className="backgroundBlur" />

      <div className="layoutWrapper">
        {/* 좌측 패널 */}
        <GlassPanel width="250px" height="100vh">
          <div className="sidebarContent">
            <div className="searchBar">
              <input type="text" placeholder="친구 검색" className="searchInput" />
              <FaSearch className="searchIcon" />
            </div>

            <div className="tabSwitch">
              <button className={`tabItem ${activeTab === 'friend' ? 'active' : ''}`} onClick={() => setActiveTab('friend')}>
                친구
              </button>
              <button className={`tabItem ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
                채팅
              </button>
              <button className={`tabItem ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                Flirto
              </button>
            </div>

            <button onClick={onLogout} className="logoutBtn">로그아웃</button>
          </div>
        </GlassPanel>

        {/* 우측 메인 패널 */}
        <div className="mainPanel">
          <GlassPanel width="calc(100% - 100px)" height="100vh">
            {renderMainPanel()}
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}

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
  if (previewView === 'friend') return (
    <FlirtoProvider>
      <MainLayout user={user} onLogout={handleLogout} />
    </FlirtoProvider>
  );
  if (previewView === 'chat') return (
    <FlirtoProvider>
      <MainLayout user={user} onLogout={handleLogout} />
    </FlirtoProvider>
  );

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
      {/* 미리보기 버튼 */}
      <div style={{ position: 'fixed', top: 10, right: 10, zIndex: 999 }}>
        <button onClick={() => setPreviewView('signin')}>Signin UI</button>
        <button onClick={() => setPreviewView('signup')}>Signup UI</button>
        <button onClick={() => setPreviewView('friend')}>Friend UI</button>
        <button onClick={() => setPreviewView('chat')}>Chat UI</button>
        <button onClick={() => setPreviewView(null)}>Reset</button>
      </div>

      {/* 초기 화면 */}
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
