// src/layouts/MainLayout.jsx
import React, { useState } from 'react';
import FloatingHearts from '../components/FloatingHearts';
import GlassPanel from '../components/GlassPanel';
import FriendList from '../pages/FriendList';
import ChatList from '../pages/ChatList';
import Settings from '../pages/Settings';
import { FaSearch } from 'react-icons/fa';
import { useFlirto } from '../context/FlirtoContext';
import '../styles/MainPage.css';

const MainLayout = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('friend');
  const { isFlirtoOn } = useFlirto();

  const renderRightPanel = () => {
    if (!isFlirtoOn) return <div className="flirtoView">Flirto를 켜보세요!</div>;
    if (activeTab === 'chat')    return <ChatList user={user} />;
    if (activeTab === 'settings')return <Settings />;
    return <div className="emptyView">친구를 선택해보세요</div>;
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
              <input
                type="text"
                placeholder="친구 검색"
                className="searchInput"
              />
              <FaSearch className="searchIcon" />
            </div>

            <div className="tabSwitch">
              <button
                className={`tabItem ${activeTab==='friend'?'active':''}`}
                onClick={()=>setActiveTab('friend')}
              >친구</button>
              <button
                className={`tabItem ${activeTab==='chat'?'active':''}`}
                onClick={()=>setActiveTab('chat')}
              >채팅</button>
              <button
                className={`tabItem ${activeTab==='settings'?'active':''}`}
                onClick={()=>setActiveTab('settings')}
              >설정</button>
            </div>

            {/* 여기서 FriendList만 렌더링 */}
            {activeTab==='friend' && <FriendList />}
              <button className="logoutBtn" onClick={onLogout}>
              로그아웃
            </button>
          </div>
        </GlassPanel>

        {/* 오른쪽 메인 패널 */}
        <div className="mainPanel">
          <GlassPanel width="calc(100% - 100px)" height="100vh">
            {renderRightPanel()}
          </GlassPanel>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
