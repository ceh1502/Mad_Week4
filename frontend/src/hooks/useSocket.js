// socket.io-client 써서 채팅창 구현하는거 (이건 )
  import { useEffect, useRef, useState } from 'react';
  import io from 'socket.io-client';

  const useSocket = (serverUrl) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);

    useEffect(() => {
      // 소켓 연결 생성 - 설정 개선
      const newSocket = io(serverUrl, {
        transports: ['polling', 'websocket'], // polling을 먼저 시도
        timeout: 20000, // 연결 타임아웃 20초
        forceNew: true, // 새 연결 강제
        reconnection: true, // 자동 재연결
        reconnectionDelay: 1000, // 재연결 딜레이
        reconnectionAttempts: 5, // 재연결 시도 횟수
        autoConnect: true // 자동 연결
      });

      // 연결 성공 이벤트
      newSocket.on('connect', () => {
        console.log('🔗 Socket 연결 성공:', newSocket.id);
        setIsConnected(true);
        setConnectionError(null);
      });

      // 연결 실패 이벤트
      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket 연결 실패:', error);
        setIsConnected(false);
        setConnectionError(error.message);
      });

      // 연결 해제 이벤트
      newSocket.on('disconnect', (reason) => {
        console.log('🔌 Socket 연결 해제:', reason);
        setIsConnected(false);
      });

      setSocket(newSocket);

      // 컴포넌트 언마운트 시 소켓 정리
      return () => {
        console.log('🧹 Socket 정리');
        newSocket.disconnect();
      };
    }, [serverUrl]);

    return { socket, isConnected, connectionError };
  };

  export default useSocket;