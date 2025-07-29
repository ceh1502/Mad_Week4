// src/pages/ChatDetail.jsx
import React, { useEffect, useRef, useState } from 'react';
import { FaArrowLeft, FaPaperPlane } from 'react-icons/fa';
import '../styles/ChatDetail.css';
// === 이건고침: Socket.io 훅 추가 ===
import useSocket from '../hooks/useSocket';

const ChatDetail = ({ chat = {}, onBack }) => {
  // === 이건고침: 상태 및 Socket 연결 설정 ===
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(chat.messages || []); // 메시지 상태 관리
  const [isAuthenticated, setIsAuthenticated] = useState(false); // 인증 상태
  const scrollRef = useRef(null);
  
  // Socket 연결 설정 - 백엔드 Render 서버 주소
  const serverUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:4444'  // 로컬 개발 환경
    : 'https://chat-analyzer-backend.onrender.com'; // 프로덕션 백엔드 서버

  const { socket, isConnected, connectionError } = useSocket(serverUrl);

  // === 이건고침: Socket 인증 및 채팅방 입장 로직 추가 ===
  useEffect(() => {
    if (socket && isConnected && !isAuthenticated) {
      const token = localStorage.getItem('token');
      if (token) {
        // JWT 토큰으로 인증
        socket.emit('authenticate', { token });
        
        // 인증 완료 이벤트 리스너
        socket.on('authenticated', (data) => {
          console.log('✅ 인증 성공:', data);
          setIsAuthenticated(true);
          
          // 채팅방 입장 (chat.id가 roomId)
          if (chat.id) {
            socket.emit('join-room', { roomId: chat.id });
          }
        });
        
        // 인증 실패 이벤트 리스너
        socket.on('auth-error', (error) => {
          console.error('❌ 인증 실패:', error);
          alert('로그인이 필요합니다.');
        });
        
        // 채팅방 입장 완료 이벤트
        socket.on('room-joined', (data) => {
          console.log('🏠 채팅방 입장 완료:', data);
          // 기존 메시지 로드
          if (data.messages) {
            setMessages(data.messages.map(msg => ({
              id: msg.id,
              text: msg.message,
              sender: msg.user_id === JSON.parse(localStorage.getItem('user')).id ? 'me' : 'other',
              timestamp: msg.created_at,
              username: msg.user?.username
            })));
          }
        });
        
        // 실시간 메시지 수신
        socket.on('receive-message', (message) => {
          console.log('📨 새 메시지 수신:', message);
          setMessages(prev => [...prev, {
            id: message.id,
            text: message.message,
            sender: message.user_id === JSON.parse(localStorage.getItem('user')).id ? 'me' : 'other',
            timestamp: message.created_at,
            username: message.user?.username
          }]);
        });
      }
    }
    
    // 컴포넌트 언마운트 시 이벤트 리스너 정리
    return () => {
      if (socket) {
        socket.off('authenticated');
        socket.off('auth-error');
        socket.off('room-joined');
        socket.off('receive-message');
      }
    };
  }, [socket, isConnected, isAuthenticated, chat.id]);
  
  // 새 메시지가 생기면 맨 아래로 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, input]);

  // === 이건고침: 메시지 전송 함수 구현 ===
  const handleSend = () => {
    if (!input.trim()) return;
    
    if (!socket || !isConnected) {
      alert('서버와 연결이 끊어졌습니다.');
      return;
    }
    
    if (!isAuthenticated) {
      alert('인증이 필요합니다.');
      return;
    }
    
    // 서버로 메시지 전송
    socket.emit('send-message', {
      roomId: chat.id,
      message: input.trim()
    });
    
    // 에러 처리를 위한 일회성 리스너
    const errorHandler = (error) => {
      console.error('메시지 전송 실패:', error);
      alert('메시지 전송에 실패했습니다: ' + error.message);
      socket.off('error', errorHandler);
    };
    
    socket.on('error', errorHandler);
    
    // 입력창 초기화
    setInput('');
  };

  const formatDate = ts => {
    const d = new Date(ts);
    return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 ${['일','월','화','수','목','금','토'][d.getDay()]}요일`;
  };

  return (
    <div className="chatDetailContainer">
      {/* 헤더 */}
      <div className="chatDetailHeader">
        <FaArrowLeft className="backIcon" onClick={onBack} />
        <div className="chatAvatarName">
          {/* avatarUrl이 없으면 빈 div라도 렌더 */}
          {chat.avatarUrl && (
            <img src={chat.avatarUrl} alt={chat.name} className="chatAvatar" />
          )}
          <span className="chatName">{chat.name ?? '알 수 없는 사용자'}</span>
        </div>
      </div>

      {/* 메시지 리스트 */}
      <div className="chatMessages" ref={scrollRef}>
        {/* === 아건고침: 메시지 렌더링에 사용자명 추가 === */}
        {messages.map((msg, i) => {
          const prev = messages[i - 1];
          const showDate =
            !prev ||
            new Date(prev.timestamp).toDateString() !==
              new Date(msg.timestamp).toDateString();

          return (
            <React.Fragment key={msg.id ?? i}>
              {showDate && (
                <div className="dateDivider">{formatDate(msg.timestamp)}</div>
              )}
              <div
                className={`messageBubble ${
                  msg.sender === 'me' ? 'outgoing' : 'incoming'
                }`}
              >
                {/* 다른 사람 메시지일 때 사용자명 표시 */}
                {msg.sender !== 'me' && (
                  <div className="messageUser">{msg.username}</div>
                )}
                <p className="messageText">{msg.text}</p>
                <span className="messageTime">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* 전송창 */}
      <div className="chatDetailFooter">
        <input
          className="messageInput"
          type="text"
          placeholder="메시지를 입력하세요"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button className="sendButton" onClick={handleSend}>
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default ChatDetail;
