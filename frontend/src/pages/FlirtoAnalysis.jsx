// src/components/FlirtoAnalysis.jsx
import React, { useState } from "react";
import "../styles/FlirtoAnalysis.css";

const FlirtoAnalysis = ({ selectedChat }) => {
  const [analysisState, setAnalysisState] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');
  const [lastAnalyzedChatId, setLastAnalyzedChatId] = useState(null); // 중복 분석 방지

  // 분석 시작 함수
  const startAnalysis = async () => {
    // 채팅방이 선택되지 않았을 때
    if (!selectedChat) {
      alert('채팅방을 먼저 선택해주세요.');
      return;
    }

    // 1:1 채팅방 체크 (채팅방 이름에 "님과 님의 채팅"이 포함되어 있는지로 판단)
    if (!selectedChat.name || !selectedChat.name.includes('님과') || !selectedChat.name.includes('님의 채팅')) {
      alert('1:1 채팅방에서만 분석이 가능합니다.');
      return;
    }

    // 중복 분석 방지 (같은 채팅방을 연속으로 분석하는 것 방지)
    if (lastAnalyzedChatId === selectedChat.id && analysisState === 'success') {
      // eslint-disable-next-line no-restricted-globals
      const reAnalyze = confirm('이미 분석한 채팅방입니다. 다시 분석하시겠습니까?');
      if (!reAnalyze) {
        return;
      }
    }

    setAnalysisState('loading');
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      const serverUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:4444'
        : 'https://chat-analyzer-backend.onrender.com';

      console.log(`🔍 Flirto 분석 시작: 채팅방 ${selectedChat.id}`);

      const response = await fetch(`${serverUrl}/api/analysis/flirto/${selectedChat.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      console.log('💕 Flirto 분석 결과:', result);

      if (result.success) {
        setAnalysisResult(result.data);
        setAnalysisState('success');
        setLastAnalyzedChatId(selectedChat.id); // 분석 완료된 채팅방 ID 저장
      } else {
        // 메시지 수 부족 체크
        if (result.message && result.message.includes('메시지')) {
          throw new Error('분석하기에는 메시지가 너무 적습니다. (최소 5개 이상 필요)');
        }
        throw new Error(result.message || '분석에 실패했습니다.');
      }

    } catch (error) {
      console.error('Flirto 분석 오류:', error);
      setError(error.message);
      setAnalysisState('error');
      
      // 에러 팝업 표시
      alert(`분석 오류: ${error.message}`);
    }
  };

  // 재분석 함수
  const resetAnalysis = () => {
    setAnalysisState('idle');
    setAnalysisResult(null);
    setError('');
  };

  // Flirto 로고 (텍스트로)
  const renderLogo = () => (
    <div className="flirtoLogo">
      <h2>💕 Flirto</h2>
      <p>AI 채팅 분석 서비스</p>
    </div>
  );

  // 초기 상태 (분석 시작 버튼)
  if (analysisState === 'idle') {
    return (
      <div className="analysisContainer">
        {renderLogo()}
        <div className="analysisButton">
          <button className="startAnalysisBtn" onClick={startAnalysis}>
            🔍 분석 시작
          </button>
          {!selectedChat && (
            <p className="analysisHint">채팅방을 선택한 후 분석을 시작하세요</p>
          )}
        </div>
      </div>
    );
  }

  // 로딩 상태
  if (analysisState === 'loading') {
    return (
      <div className="analysisContainer">
        {renderLogo()}
        <div className="analysisLoading">
          <h3>🔄 분석중...</h3>
          <p>채팅 내용을 분석하고 있습니다.</p>
          <p>잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (analysisState === 'error') {
    return (
      <div className="analysisContainer">
        {renderLogo()}
        <div className="analysisError">
          <h3>❌ 분석 실패</h3>
          <p>{error}</p>
          <button className="retryBtn" onClick={resetAnalysis}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 성공 상태 (분석 결과 표시)
  if (analysisState === 'success' && analysisResult) {
    return (
      <div className="analysisContainer">
        {renderLogo()}
        
        {/* 코멘트 */}
        <div className="comments">
          <h3>💬 Comments</h3>
          <p>{analysisResult.comment}</p>
        </div>

        {/* 분석 점수 */}
        <div className="analysis">
          <h3>📊 Analysis</h3>
          <div className="scoreRow">
            <div className="scoreCircle">
              {analysisResult.analysis.호감도}<br/>호감도
            </div>
            <div className="scoreCircle">
              {analysisResult.analysis.관심도}<br/>관심도
            </div>
            <div className="scoreCircle">
              {analysisResult.analysis.친밀도}<br/>친밀도
            </div>
          </div>
        </div>

        {/* 추천 답변 */}
        <div className="suggestions">
          <h3>💡 Suggestions</h3>
          {analysisResult.suggestions && analysisResult.suggestions.map((suggestion, index) => (
            <p key={index} className="suggestionItem">{suggestion}</p>
          ))}
        </div>

        {/* 재분석 버튼 */}
        <div className="analysisActions">
          <button className="reAnalysisBtn" onClick={resetAnalysis}>
            🔄 재분석
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default FlirtoAnalysis;
