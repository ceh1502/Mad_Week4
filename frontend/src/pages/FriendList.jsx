import React, { useState } from 'react';
import FloatingHearts from '../components/FloatingHearts';
import GlassPanel from '../components/GlassPanel';
import '../styles/MainPage.css';
import { FaSearch } from 'react-icons/fa';

const friends = [
  { id: 1, name: 'Ken' },
  { id: 2, name: 'Siyeon' },
  { id: 3, name: 'Boyeon' },
  { id: 4, name: 'Jinwoong' },
];

const FriendList = () => {
  const [activeTab, setActiveTab] = useState('friend');

  return (
    <div className="FriendPageWrapper">
      <FloatingHearts />
      <div className="backgroundBlur" />

      {/* 전체 레이아웃 */}
      <div className="layoutWrapper">
        {/* 좌측 패널 */}
        <GlassPanel width="250px" height="100vh">
          <div className="sidebarContent">
            {/* 검색창 */}
            <div className="searchBar">
              <input
                type="text"
                placeholder="친구 검색"
                className="searchInput"
              />
              <FaSearch className="searchIcon" />
            </div>

            {/* 탭 버튼 */}
            <div className="tabSwitch">
              <button
                className={`tabItem ${activeTab === 'friend' ? 'active' : ''}`}
                onClick={() => setActiveTab('friend')}
              >
                친구
              </button>
              <button
                className={`tabItem ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                채팅
              </button>
              <button
                className={`tabItem ${activeTab === 'flirto' ? 'active' : ''}`}
                onClick={() => setActiveTab('flirto')}
              >
                Flirto
              </button>
            </div>

            {/* 친구 리스트 */}
            {activeTab === 'friend' && (
              <div className="friendList">
                {friends.map((friend) => (
                  <div key={friend.id} className="friendItem">
                    <div className="photoCircle"></div>
                    <span className="friendName">{friend.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassPanel>

        {/* 오른쪽 메인 영역 */}
        <div className="mainPanel">
          <GlassPanel width="calc(100% - 100px)" height="100vh">
            <div className="chatView">Flirto를 켜보세요!</div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
};

export default FriendList;
