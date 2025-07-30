import React, { useState, useEffect } from 'react';

const CatAvatar = ({ userId, size = 50, className = '' }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadCatImage = async () => {
      try {
        setLoading(true);
        setError(false);
        
        // 사용자 ID를 기반으로 고정된 시드 생성 (같은 사용자는 항상 같은 고양이)
        const seed = userId ? Math.abs(userId * 31) % 1000 : Math.floor(Math.random() * 1000);
        
        // The Cat API 호출 (API 키 불필요)
        const response = await fetch(`https://api.thecatapi.com/v1/images/search?limit=1&size=thumb&order=RANDOM&seed=${seed}`);
        
        if (!response.ok) {
          throw new Error('고양이 이미지 로드 실패');
        }
        
        const data = await response.json();
        
        if (data && data.length > 0 && data[0].url) {
          setImageUrl(data[0].url);
        } else {
          throw new Error('고양이 이미지 데이터 없음');
        }
        
      } catch (error) {
        console.error('고양이 이미지 로드 오류:', error);
        setError(true);
        // 에러 시 robohash 고양이 아바타로 fallback
        const fallbackSeed = userId || Math.floor(Math.random() * 1000);
        setImageUrl(`https://robohash.org/${fallbackSeed}.png?set=set4&size=${size}x${size}`);
      } finally {
        setLoading(false);
      }
    };

    loadCatImage();
  }, [userId, size]);

  const avatarStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    objectFit: 'cover',
    backgroundColor: loading ? '#f0f0f0' : 'transparent',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${size * 0.4}px`,
    color: '#999'
  };

  if (loading) {
    return (
      <div className={`photoCircle ${className}`} style={avatarStyle}>
        🐱
      </div>
    );
  }

  return (
    <img 
      src={imageUrl}
      alt="고양이 아바타"
      className={`photoCircle ${className}`}
      style={avatarStyle}
      onError={() => {
        if (!error) {
          setError(true);
          const fallbackSeed = userId || Math.floor(Math.random() * 1000);
          setImageUrl(`https://robohash.org/${fallbackSeed}.png?set=set4&size=${size}x${size}`);
        }
      }}
    />
  );
};

export default CatAvatar;