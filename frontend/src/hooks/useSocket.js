// socket.io-client 써서 채팅창 구현하는거 (이건 )
  import { useEffect, useRef, useState } from 'react';
  import io from 'socket.io-client';

  const useSocket = (serverUrl) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState(null);

    useEffect(() => {
      // 소켓 연결 생성
      const newSocket = io(serverUrl, {
        transports: ['websocket', 'polling'], // 연결 방법 설정
        timeout: 20000 // 연결 타임아웃 20초
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