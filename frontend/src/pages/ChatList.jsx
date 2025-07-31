// src/pages/FriendList.jsx
import React, { useState, useEffect } from 'react';
import CatAvatar from '../components/CatAvatar';
import '../styles/MainPage.css';

// === 고침1 - 더미 데이터 제거하고 실제 API로 친구 목록 가져오기 ===
// const friends = [ ... ]; // 더미 데이터 제거

const ChatList = ({ onSelect }) => {
  // === 고침2 - 친구 목록 상태 관리 추가 ===
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // === 고침3 - 친구 목록 가져오기 API ===
  const fetchFriends = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setFriends([]);
        return;
      }

      const serverUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:4444'
        : 'https://mad-week4-zqbh.onrender.com';

      const response = await fetch(`${serverUrl}/api/friends`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        // 백엔드 데이터를 기존 형식에 맞게 변환
        const formattedFriends = result.data.map(friend => ({
          id: friend.id, // 사용자 ID 추가 (고양이 아바타용)
          username: friend.username,
          name: friend.name || friend.username, // 회원가입 시 입력한 이름 우선 표시
          lastMessage: '채팅하기'
        }));
        setFriends(formattedFriends);
      } else {
        setFriends([]);
      }
    } catch (error) {
      console.error('친구 목록 조회 오류:', error);
      setError('친구 목록을 불러오는데 실패했습니다.');
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  // === 고침4 - 컴포넌트 마운트 시 친구 목록 로드 ===
  useEffect(() => {
    fetchFriends();
  }, []);

  const handleFriendClick = async (friend) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      // 1:1 채팅방 생성/찾기 API 호출
      const serverUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:4444'
        : 'https://mad-week4-zqbh.onrender.com';

      console.log('🔗 API 호출 URL:', `${serverUrl}/api/rooms/direct`);
      const response = await fetch(`${serverUrl}/api/rooms/direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          friendUsername: friend.username
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // 채팅방 정보를 onSelect에 전달
        const chatRoom = {
          id: result.data.id, // 실제 채팅방 ID
          name: friend.name, // 친구 이름 표시
          messages: [] // 빈 메시지 배열
        };
        console.log('💬 1:1 채팅방 생성/연결:', result);
        onSelect(chatRoom);
      } else {
        alert('채팅방 생성에 실패했습니다: ' + result.message);
      }
    } catch (error) {
      console.error('채팅방 생성 오류:', error);
      alert('채팅방 생성 중 오류가 발생했습니다.');
    }
  };

  // === 고침5 - 빈 상태 및 로딩 상태 처리 ===
  if (loading) {
    return (
      <div className="friendListContainer">
        <div className="friendItem">
          <span className="friendName">친구 목록 로딩 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="friendListContainer">
        <div className="friendItem">
          <span className="friendName" style={{color: '#ff6b6b'}}>{error}</span>
        </div>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="friendListContainer">
        <div className="friendItem">
          <span className="friendName">친구를 추가해보세요!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="friendListContainer">
      {friends.map((friend) => (
        <div key={friend.username} className="friendItem" 
             onClick={() => handleFriendClick(friend)}>
          <CatAvatar userId={friend.id} size={50} />
          <span className="friendName">{friend.name}</span>
          <span className="latestMessage">{friend.lastMessage}</span>
        </div>
      ))}
    </div>
  );

};

export default ChatList;
