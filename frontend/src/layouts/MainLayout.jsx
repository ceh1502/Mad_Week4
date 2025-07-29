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
  
  // === 고침1 - 친구 추가 기능을 위한 상태 추가 ===
  const [friendSearchInput, setFriendSearchInput] = useState('');
  const [isAddingFriend, setIsAddingFriend] = useState(false);

  // === 고침2 - 친구 추가 함수 구현 ===
  const handleAddFriend = async () => {
    if (!friendSearchInput.trim()) {
      alert('친구 아이디를 입력해주세요.');
      return;
    }

    if (isAddingFriend) return; // 중복 클릭 방지

    try {
      setIsAddingFriend(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const serverUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:4444'
        : 'https://chat-analyzer-backend.onrender.com';

      const response = await fetch(`${serverUrl}/api/friends/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          friendUsername: friendSearchInput.trim()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`${result.data.username}님을 친구로 추가했습니다!`);
        setFriendSearchInput(''); // 입력창 초기화
        // TODO: 친구 목록 새로고침 (나중에 ChatList 컴포넌트 연동 시 구현)
      } else {
        alert('친구 추가 실패: ' + result.message);
      }
    } catch (error) {
      console.error('친구 추가 오류:', error);
      alert('친구 추가 중 오류가 발생했습니다.');
    } finally {
      setIsAddingFriend(false);
    }
  };

  // === 고침3 - 엔터 키 입력 처리 ===
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddFriend();
    }
  };

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
                    {/* === 고침4 - 검색창을 친구 추가 기능으로 변경 (UI는 동일) === */}
                    <div className="searchBar">
                      <input
                        type="text"
                        placeholder="친구 아이디 입력 후 엔터"
                        className="searchInput"
                        value={friendSearchInput}
                        onChange={(e) => setFriendSearchInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isAddingFriend}
                      />
                      <FaSearch 
                        className="searchIcon" 
                        onClick={handleAddFriend}
                        style={{ 
                          cursor: isAddingFriend ? 'not-allowed' : 'pointer',
                          opacity: isAddingFriend ? 0.5 : 1
                        }}
                      />
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
