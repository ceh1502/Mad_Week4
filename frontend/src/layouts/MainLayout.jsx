// src/layouts/MainLayout.jsx
import React, { useState } from 'react';
import FloatingHearts from '../components/FloatingHearts';
import GlassPanel from '../components/GlassPanel';
import FriendList from '../pages/FriendList';
import ChatList   from '../pages/ChatList';
import ChatDetail from '../pages/ChatDetail';
import Settings   from '../pages/Settings';
import { FaSearch } from 'react-icons/fa';
import { useFlirto } from '../context/FlirtoContext';
import '../styles/MainPage.css';

const MainLayout = ({ user, onLogout, defaultTab = 'friend' }) => {
  const [activeTab, setActiveTab]       = useState(defaultTab);
  const [selectedChat, setSelectedChat] = useState(null);
  const { isFlirtoOn } = useFlirto();

  // 오른쪽 메인 패널 분기 (Flirto ON/OFF 포함)
  const renderRightPanel = () => {
    if (!isFlirtoOn) return <div className="flirtoView">Flirto를 켜보세요!</div>;
    if (activeTab === 'settings') return <Settings />;
    if (activeTab === 'friend')   return <div className="emptyView">친구를 선택해보세요</div>;
    if (activeTab === 'chat') {
      // 채팅 리스트에서 대화 선택 전
      return selectedChat
        ? <div className="emptyView">왼쪽에서 채팅 상세를 봐보세요</div>
        : <div className="emptyView">채팅을 선택해보세요</div>;
    }
    return null;
  };

  return (
    <div className="FriendPageWrapper">
      <FloatingHearts />
      <div className="backgroundBlur" />

      <div className="layoutWrapper">
        {/* 좌측 패널 */}
        <GlassPanel width="250px" height="100vh">
          <div className="sidebarContent">
            {/*
              1) 채팅 상세 선택 시 ▶ 탭/검색/목록 일체 숨기고 ChatDetail 렌더
              2) 그렇지 않을 때 ▶ 기존 탭/검색/목록/로그아웃
            */}
            {selectedChat ? (
              <ChatDetail
                chat={selectedChat}
                onBack={() => setSelectedChat(null)}
              />
            ) : (
              <>
                {/* 탭 */}
                <div className="tabSwitch">
                  <button
                    className={`tabItem ${activeTab==='friend'   ? 'active':''}`}
                    onClick={()=>{
                      setActiveTab('friend');
                      setSelectedChat(null);
                    }}
                  >친구</button>
                  <button
                    className={`tabItem ${activeTab==='chat'     ? 'active':''}`}
                    onClick={()=>{
                      setActiveTab('chat');
                      setSelectedChat(null);
                    }}
                  >채팅</button>
                  <button
                    className={`tabItem ${activeTab==='settings' ? 'active':''}`}
                    onClick={()=>{
                      setActiveTab('settings');
                      setSelectedChat(null);
                    }}
                  >설정</button>
                </div>

                {/* 친구 탭: 검색 + 친구 목록 */}
                {activeTab==='friend' && (
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

                {/* 채팅 탭: 채팅 리스트 (클릭 시 상세 모드 진입) */}
                {activeTab==='chat' && (
                  <ChatList onSelect={(chat) => {
                    setSelectedChat(chat);
                  }} />
                )}

                {/* 설정 탭 */}
                {activeTab==='settings' && <Settings />}

                {/* 로그아웃 버튼 */}
                <button className="logoutBtn" onClick={onLogout}>
                  로그아웃
                </button>
              </>
            )}
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
