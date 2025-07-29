import React, { useState } from 'react';
import FloatingHearts2 from '../components/FloatingHearts2';
import GlassPanel from '../components/GlassPanel';
import '../styles/Friend.css';

const friends = [
  { id: 1, name: 'Ken' },
  { id: 2, name: 'Siyeon' },
  { id: 3, name: 'Boyeon' },
  { id: 4, name: 'Jinwoong' },
];

const Friend = () => {
  const [activeTab, setActiveTab] = useState('friend');

  return (
    <div className="FriendPageWrapper">
      <FloatingHearts2 />
      <div className="backgroundBlur" />
      <GlassPanel width="350px" height="600px">
        <div className="glassContent">
          {/* 상단 탭 + Add 버튼 */}
          <div className="headerRow">
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
            <button className="addButton">Add</button>
          </div>

          {/* 친구 리스트 */}
          <div className="friendList">
            {friends.map((friend) => (
              <div key={friend.id} className="friendItem">
                <div className="photoCircle"></div>
                <span className="friendName">{friend.name}</span>
              </div>
            ))}
          </div>
        </div>
      </GlassPanel>
    </div>
  );
};

export default Friend;
