import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import io from 'socket.io-client';
import GlassPanel from '../components/GlassPanel';
import FloatingHearts from '../components/FloatingHearts';

const ChatPage = ({ user, onLogout }) => {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [rooms, setRooms] = useState([]);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [analysis, setAnalysis] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const socketConnection = io(process.env.REACT_APP_API_URL, {
            auth: { token }
        });

        socketConnection.on('connect', () => {
            console.log('Connected');
            loadRooms();
        });

        socketConnection.on('message', (message) => {
            setMessages((prev) => [...prev, message]);
        });

        socketConnection.on('roomCreated', (room) => {
            setRooms((prev) => [...prev, room]);
        });

        setSocket(socketConnection);

        return () => socketConnection.close();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadRooms = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/rooms`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setRooms(data);
        } catch (error) {
            console.error('Failed to load rooms:', error);
        }
    };

    const createRoom = () => {
        const roomName = prompt('Enter room name:');
        if (roomName && socket) {
            socket.emit('createRoom', { name: roomName });
        }
    };

    const joinRoom = (roomId) => {
        if (socket && currentRoom !== roomId) {
            if (currentRoom) {
                socket.emit('leaveRoom', currentRoom);
            }
            socket.emit('joinRoom', roomId);
            setCurrentRoom(roomId);
            setMessages([]);
            loadMessages(roomId);
        }
    };

    const loadMessages = async (roomId) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/messages/${roomId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setMessages(data);
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() && socket && currentRoom) {
            socket.emit('sendMessage', {
                room_id: currentRoom,
                content: newMessage
            });
            setNewMessage('');
        }
    };

    const analyzeChat = async () => {
        if (!currentRoom) {
            alert('Please select a room.');
            return;
        }
        
        setLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/analysis/chat/${currentRoom}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            setAnalysis(data.analysis || 'No analysis results.');
        } catch (error) {
            console.error('Analysis failed:', error);
            setAnalysis('Analysis failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ChatContainer>
            <FloatingHearts />
            <div className="backgroundBlur" />
            <ChatWrapper>
                <Sidebar>
                    <UserInfo>
                        <span>{user?.username}</span>
                        <LogoutBtn onClick={onLogout}>Logout</LogoutBtn>
                    </UserInfo>
                    <RoomSection>
                        <RoomHeader>
                            <h3>Chat Rooms</h3>
                            <CreateRoomBtn onClick={createRoom}>+</CreateRoomBtn>
                        </RoomHeader>
                        <RoomList>
                            {rooms.map((room) => (
                                <RoomItem
                                    key={room.id}
                                    active={currentRoom === room.id}
                                    onClick={() => joinRoom(room.id)}
                                >
                                    {room.name}
                                </RoomItem>
                            ))}
                        </RoomList>
                    </RoomSection>
                    <AnalysisSection>
                        <AnalyzeBtn onClick={analyzeChat} disabled={!currentRoom || loading}>
                            {loading ? 'Analyzing...' : 'AI Analysis'}
                        </AnalyzeBtn>
                        {analysis && (
                            <AnalysisResult>
                                <h4>Analysis Result:</h4>
                                <p>{analysis}</p>
                            </AnalysisResult>
                        )}
                    </AnalysisSection>
                </Sidebar>
                
                <ChatMain>
                    <GlassPanel width="100%" height="100%">
                        {currentRoom ? (
                            <>
                                <MessagesContainer>
                                    {messages.map((msg, index) => (
                                        <Message
                                            key={index}
                                            isOwn={msg.user_id === user?.id}
                                        >
                                            <MessageUser>{msg.User?.username}</MessageUser>
                                            <MessageContent>{msg.content}</MessageContent>
                                            <MessageTime>
                                                {new Date(msg.created_at).toLocaleTimeString()}
                                            </MessageTime>
                                        </Message>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </MessagesContainer>
                                <MessageForm onSubmit={sendMessage}>
                                    <MessageInput
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Enter your message..."
                                    />
                                    <SendButton type="submit">Send</SendButton>
                                </MessageForm>
                            </>
                        ) : (
                            <WelcomeMessage>
                                Select a chat room or create a new one!
                            </WelcomeMessage>
                        )}
                    </GlassPanel>
                </ChatMain>
            </ChatWrapper>
        </ChatContainer>
    );
};

const ChatContainer = styled.div`
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    position: relative;
    
    .backgroundBlur {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        backdrop-filter: blur(10px);
        z-index: 1;
    }
`;

const ChatWrapper = styled.div`
    position: relative;
    z-index: 2;
    display: flex;
    height: 100vh;
    padding: 20px;
    gap: 20px;
`;

const Sidebar = styled.div`
    width: 300px;
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const UserInfo = styled.div`
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    font-weight: bold;
`;

const LogoutBtn = styled.button`
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 5px;
    padding: 5px 10px;
    color: white;
    cursor: pointer;
    font-size: 12px;
    
    &:hover {
        background: rgba(255, 255, 255, 0.3);
    }
`;

const RoomSection = styled.div`
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 15px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    flex: 1;
`;

const RoomHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    
    h3 {
        color: white;
        margin: 0;
        font-size: 16px;
    }
`;

const CreateRoomBtn = styled.button`
    background: rgba(255, 255, 255, 0.3);
    border: none;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    color: white;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
        background: rgba(255, 255, 255, 0.4);
    }
`;

const RoomList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 200px;
    overflow-y: auto;
`;

const RoomItem = styled.div`
    padding: 10px;
    border-radius: 8px;
    cursor: pointer;
    color: white;
    background: ${props => props.active ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
    
    &:hover {
        background: rgba(255, 255, 255, 0.2);
    }
`;

const AnalysisSection = styled.div`
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 15px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
`;

const AnalyzeBtn = styled.button`
    width: 100%;
    background: rgba(255, 255, 255, 0.3);
    border: none;
    border-radius: 8px;
    padding: 12px;
    color: white;
    cursor: pointer;
    font-weight: bold;
    margin-bottom: 15px;
    
    &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.4);
    }
    
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const AnalysisResult = styled.div`
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 10px;
    color: white;
    font-size: 12px;
    max-height: 150px;
    overflow-y: auto;
    
    h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
    }
    
    p {
        margin: 0;
        line-height: 1.4;
    }
`;

const ChatMain = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
`;

const MessagesContainer = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const Message = styled.div`
    align-self: ${props => props.isOwn ? 'flex-end' : 'flex-start'};
    max-width: 70%;
    background: ${props => props.isOwn ? 'rgba(103, 126, 234, 0.8)' : 'rgba(255, 255, 255, 0.8)'};
    color: ${props => props.isOwn ? 'white' : 'black'};
    padding: 10px 15px;
    border-radius: 15px;
    margin-bottom: 5px;
`;

const MessageUser = styled.div`
    font-size: 12px;
    font-weight: bold;
    margin-bottom: 4px;
    opacity: 0.8;
`;

const MessageContent = styled.div`
    margin-bottom: 4px;
`;

const MessageTime = styled.div`
    font-size: 10px;
    opacity: 0.6;
    text-align: right;
`;

const MessageForm = styled.form`
    display: flex;
    padding: 20px;
    gap: 10px;
`;

const MessageInput = styled.input`
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 25px;
    background: rgba(255, 255, 255, 0.9);
    outline: none;
    
    &::placeholder {
        color: #999;
    }
`;

const SendButton = styled.button`
    background: rgba(103, 126, 234, 0.8);
    border: none;
    border-radius: 25px;
    padding: 12px 20px;
    color: white;
    cursor: pointer;
    font-weight: bold;
    
    &:hover {
        background: rgba(103, 126, 234, 1);
    }
`;

const WelcomeMessage = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: rgba(255, 255, 255, 0.7);
    font-size: 18px;
    text-align: center;
`;

export default ChatPage;
