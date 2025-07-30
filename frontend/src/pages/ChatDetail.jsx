// src/pages/ChatDetail.jsx
import React, { useEffect, useRef, useState } from 'react';
import { FaArrowLeft, FaPaperPlane } from 'react-icons/fa';
import CatAvatar from '../components/CatAvatar';
import '../styles/ChatDetail.css';
// === 이건고침: Socket.io 훅 추가 ===
import useSocket from '../hooks/useSocket';

const ChatDetail = ({ chat = {}, onBack }) => {
  // === 고침1: 상태 및 Socket 연결 설정 + 사용자 정보 안전하게 파싱 ===
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(chat.messages || []); // 메시지 상태 관리
  const [isAuthenticated, setIsAuthenticated] = useState(false); // 인증 상태
  const scrollRef = useRef(null);
  
  // 디버깅용 로그
  console.log('ChatDetail 렌더링:', { 
    chatId: chat.id, 
    messagesCount: messages.length,
    messages: messages
  });
  
  // 안전한 사용자 정보 파싱
  const getCurrentUser = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('사용자 정보 파싱 실패:', error);
      return null;
    }
  };
  
  // Socket 연결 설정 - 백엔드 Render 서버 주소
  const serverUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:4444'  // 로컬 개발 환경
    : 'https://chat-analyzer-backend.onrender.com'; // 프로덕션 백엔드 서버

  const { socket, isConnected, connectionError } = useSocket(serverUrl);

  // === 고침2: Socket 인증 및 채팅방 입장 로직 수정 (중복 등록 방지) ===
  useEffect(() => {
    console.log('채팅방 변경됨:', chat.id);
    // 채팅방 변경 시 인증 상태 초기화
    setIsAuthenticated(false);
    setMessages([]); // 메시지도 초기화
  }, [chat.id]);
  
  useEffect(() => {
    if (socket && isConnected && !isAuthenticated) {
      const token = localStorage.getItem('token');
      const currentUser = getCurrentUser();
      
      if (!token || !currentUser) {
        alert('로그인이 필요합니다.');
        return;
      }
      
      // 채팅방 ID 검증
      if (!chat.id || isNaN(chat.id)) {
        console.error('유효하지 않은 채팅방 ID:', chat.id);
        return;
      }
      
      // JWT 토큰으로 인증
      socket.emit('authenticate', { token });
      
      // 인증 완료 이벤트 리스너
      const handleAuthenticated = (data) => {
        console.log('✅ 인증 성공:', data);
        setIsAuthenticated(true);
        
        // 채팅방 입장 (chat.id가 roomId)
        console.log('🚪 채팅방 입장 요청:', { roomId: chat.id });
        socket.emit('join-room', { roomId: chat.id });
      };
      
      // 인증 실패 이벤트 리스너
      const handleAuthError = (error) => {
        console.error('❌ 인증 실패:', error);
        alert('로그인이 필요합니다.');
        setIsAuthenticated(false);
      };
      
      // 이벤트 리스너 등록
      console.log('🎯 인증 관련 이벤트 리스너 등록');
      socket.on('authenticated', handleAuthenticated);
      socket.on('auth-error', handleAuthError);
      
      // 모든 socket 이벤트를 로깅 (디버깅용)
      const originalEmit = socket.emit;
      socket.emit = function(...args) {
        console.log('📤 Socket emit:', args[0], args[1]);
        return originalEmit.apply(this, args);
      };
      
      // 모든 수신 이벤트 로깅
      const originalOn = socket.on;
      socket.on = function(event, handler) {
        const wrappedHandler = function(...args) {
          console.log('📥 Socket receive:', event, args[0]);
          return handler.apply(this, args);
        };
        return originalOn.call(this, event, wrappedHandler);
      };
      
      // 컴포넌트 언마운트 시 이벤트 리스너 정리
      return () => {
        socket.off('authenticated', handleAuthenticated);
        socket.off('auth-error', handleAuthError);
      };
    }
  }, [socket, isConnected, isAuthenticated, chat.id]);

  // 메시지 수신 이벤트 리스너를 별도 useEffect로 분리
  useEffect(() => {
    if (socket && isAuthenticated) {
      console.log('🎯 메시지 및 채팅방 관련 리스너 등록');
      
      // 채팅방 입장 완료 이벤트
      const handleRoomJoined = (data) => {
        console.log('🏠 채팅방 입장 완료:', data);
        console.log('받은 메시지 개수:', data.messages?.length || 0);
        
        // 기존 메시지 로드
        if (data.messages && data.messages.length > 0) {
          const currentUser = getCurrentUser();
          console.log('메시지 로딩 시 현재 사용자:', currentUser);
          
          if (currentUser) {
            const loadedMessages = data.messages.map(msg => ({
              id: msg.id,
              text: msg.message,
              sender: msg.user_id === currentUser.id ? 'me' : 'other',
              timestamp: msg.created_at,
              username: msg.user?.username
            }));
            
            console.log('로드된 메시지들:', loadedMessages);
            setMessages(loadedMessages);
          } else {
            console.error('현재 사용자 정보가 없어서 메시지를 로드할 수 없음');
          }
        } else {
          console.log('로드할 메시지가 없음');
          setMessages([]); // 빈 배열로 초기화
        }
      };
      
      // 실시간 메시지 수신
      const handleReceiveMessage = (message) => {
        console.log('📨 새 메시지 수신:', message);
        const currentUser = getCurrentUser();
        console.log('현재 사용자:', currentUser);
        
        if (currentUser) {
          const newMessage = {
            id: message.id,
            text: message.message,
            sender: message.user_id === currentUser.id ? 'me' : 'other',
            timestamp: message.created_at,
            username: message.user?.username
          };
          console.log('새 메시지 객체:', newMessage);
          
          setMessages(prev => {
            console.log('이전 메시지들:', prev);
            const updated = [...prev, newMessage];
            console.log('업데이트된 메시지들:', updated);
            return updated;
          });
        } else {
          console.error('현재 사용자를 찾을 수 없음');
        }
      };
      
      // 에러 처리 리스너 (더 상세한 로깅)
      const handleError = (error) => {
        console.error('🚨 Socket 에러:', error);
        console.log('에러 상세:', JSON.stringify(error, null, 2));
        
        if (error.message === '존재하지 않는 채팅방입니다.') {
          console.error('💥 채팅방이 데이터베이스에 없습니다!');
          alert('채팅방을 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.');
        } else {
          alert('오류가 발생했습니다: ' + error.message);
        }
      };
      
      // 이벤트 리스너 등록
      socket.on('room-joined', handleRoomJoined);
      socket.on('receive-message', handleReceiveMessage);
      socket.on('error', handleError);
      
      // 컴포넌트 언마운트 시 이벤트 리스너 정리
      return () => {
        console.log('메시지 및 채팅방 리스너 해제');
        socket.off('room-joined', handleRoomJoined);
        socket.off('receive-message', handleReceiveMessage);
        socket.off('error', handleError);
      };
    }
  }, [socket, isAuthenticated]);
  
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
          {/* 고양이 아바타 사용 - 채팅방 ID를 시드로 사용 */}
          <CatAvatar userId={chat.id} size={40} className="chatAvatar" />
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
