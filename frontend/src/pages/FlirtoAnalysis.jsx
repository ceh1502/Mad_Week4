// src/components/FlirtoAnalysis.jsx
import React from "react";
import "../styles/FlirtoAnalysis.css";

const FlirtoAnalysis = () => {
  return (
    <div className="analysisContainer">
      <div className="comments">
        <h3>Comments</h3>
        <p>상대와 첫만남인 상태로 서로 예의를 갖추며 대화하고 있습니다.</p>
      </div>
      <div className="analysis">
        <h3>Analysis</h3>
        <div className="scoreRow">
          <div className="scoreCircle">81<br/>호감도</div>
          <div className="scoreCircle">47<br/>관심도</div>
          <div className="scoreCircle">90<br/>친밀도</div>
        </div>
      </div>
      <div className="suggestions">
        <h3>Suggestions</h3>
        <p>오늘 날씨가 참 좋네요!</p>
        <p>취미가 무엇인가요?</p>
      </div>
    </div>
  );
};

export default FlirtoAnalysis;
