import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

const friends = ['Ken', 'Siyeon', 'Boyeon', 'Jinwoong'];

const Sidebar = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = () => {
    if (location.pathname.includes('chats')) return 'chat';
    if (location.pathname.includes('flirto')) return 'flirto';
    return 'friend';
  };

  return (
    <div className="sidebarWrapper">
      <div className="tabButtons">
        <button className={activeTab() === 'friend' ? 'active' : ''} onClick={() => navigate('/friends')}>
          친구
        </button>
        <button className={activeTab() === 'chat' ? 'active' : ''} onClick={() => navigate('/chats')}>
          채팅
        </button>
        <button className={activeTab() === 'flirto' ? 'active' : ''} onClick={() => navigate('/flirto')}>
          Flirto
        </button>
      </div>
      <div className="friendList">
        {friends.map((name, i) => (
          <div className="friendItem" key={i}>
            <div className="friendAvatar" />
            <span>{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
