// src/pages/ChatDetail.jsx
import React, { useEffect, useRef, useState } from 'react';
import { FaArrowLeft, FaPaperPlane } from 'react-icons/fa';
import '../styles/ChatDetail.css';

const ChatDetail = ({ chat = {}, onBack }) => {
  // chat.messages가 undefined일 때 빈 배열 쓰기
  const messages = chat.messages ?? [];

  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  // 새 메시지가 생기면 맨 아래로 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, input]);

  const handleSend = () => {
    if (!input.trim()) return;
    // TODO: 실제 전송 로직 구현
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
