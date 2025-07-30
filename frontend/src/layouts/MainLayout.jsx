// src/layouts/MainLayout.jsx
import React, { useState } from 'react';
import FloatingHearts from '../components/FloatingHearts';
import GlassPanel from '../components/GlassPanel';
// === 고침1 - 중복 import 수정 ===
// import FriendList from '../pages/FriendList'; // 더미 데이터 컴포넌트 제거
import ChatList from '../pages/ChatList'; // 친구 목록용 (API 연동)
import RealChatList from '../pages/RealChatList'; // 채팅방 목록용
import ChatDetail from '../pages/ChatDetail';
import Settings   from '../pages/Settings';
import { FaSearch } from 'react-icons/fa';
import FlirtoAnalysis from '../pages/FlirtoAnalysis';
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
        // === 고침5 - 친구 추가 후 목록 새로고침 (더 부드럽게) ===
        setTimeout(() => {
          window.location.reload(); // 페이지 새로고침으로 친구 목록 업데이트
        }, 1500); // 알림을 볼 시간을 위해 1.5초 대기
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
    return isFlirtoOn 
      ? <FlirtoAnalysis selectedChat={selectedChat} /> 
      : <div className="flirtoView">Flirto를 켜보세요!</div>;
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
                        placeholder="친구 아이디 입력"
                        className="searchInput"
                        value={friendSearchInput}
                        onChange={(e) => setFriendSearchInput(e.target.value)}
                        onKeyDown={handleKeyPress}
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
                    {/* === 고침2 - 친구 탭에 onSelect 추가하고 친구 클릭 시 채팅방 생성 === */}
                    <ChatList onSelect={(chat) => {
                      setSelectedChat(chat);
                    }} />
                  </>
                )}

                {/* === 고침3 - 채팅 탭: 실제 채팅방 목록 컴포넌트 사용 === */}
                {activeTab==='chat' && (
                  <RealChatList onSelect={(chat) => {
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
