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

const MainLayout = ({ user, onLogout, defaultTab = 'friend' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { isFlirtoOn } = useFlirto();

  const renderRightPanel = () => {
    if (!isFlirtoOn) return <div className="flirtoView">Flirto를 켜보세요!</div>;
    if (activeTab === 'chat')    return <div>채팅 내용을 여기에 표시하세요</div>;
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
            {/* 탭 버튼 */}
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

            {/* 친구 탭에서만 검색창 + 친구 목록 */}
            {activeTab === 'friend' && (
              <>
                <div className="searchBar">
                  <input
                    type="text"
                    placeholder="친구 검색"
                    className="searchInput"
                  />
                  <FaSearch className="searchIcon" />
                </div>
                <FriendList />
              </>
            )}

            {/* 채팅 탭에서만 채팅 목록 */}
            {activeTab === 'chat' && (
              <ChatList />
            )}

            {/* 설정 탭에서만 설정 */}
            {activeTab === 'settings' && <Settings />}

            {/* 로그아웃 버튼은 항상 */}
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
