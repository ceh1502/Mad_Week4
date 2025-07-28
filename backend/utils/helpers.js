const { v4: uuidv4 } = require('uuid');
const { 
  MESSAGE_LIMITS, 
  EMOTION_KEYWORDS, 
  TOPIC_KEYWORDS,
  SENTIMENT_TYPES,
  INTEREST_LEVELS 
} = require('./constants');

// 메시지 검증
function validateMessage(message) {
  const errors = [];
  
  if (!message || typeof message !== 'string') {
    errors.push('메시지는 문자열이어야 합니다.');
    return { isValid: false, errors };
  }
  
  const trimmed = message.trim();
  
  if (trimmed.length < MESSAGE_LIMITS.MIN_LENGTH) {
    errors.push('메시지를 입력해주세요.');
  }
  
  if (trimmed.length > MESSAGE_LIMITS.MAX_LENGTH) {
    errors.push(`메시지는 ${MESSAGE_LIMITS.MAX_LENGTH}자를 초과할 수 없습니다.`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    cleanMessage: trimmed
  };
}

// UUID 검증
function isValidUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// 방 ID 생성
function generateRoomId(prefix = 'room') {
  return `${prefix}-${uuidv4()}`;
}

// 메시지 ID 생성
function generateMessageId() {
  return uuidv4();
}

// 날짜 포맷팅
function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  const d = new Date(date);
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

// 상대 시간 표시 (예: "방금 전", "5분 전")
function getRelativeTime(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 30) return '방금 전';
  if (diffSec < 60) return `${diffSec}초 전`;
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  
  return formatDate(date, 'MM-DD HH:mm');
}

// 텍스트에서 이모지 추출
function extractEmojis(text) {
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  return text.match(emojiRegex) || [];
}

// 텍스트 길이 분석
function analyzeTextLength(text) {
  const chars = text.length;
  const words = text.trim().split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  
  return { chars, words, sentences };
}

// 감정 분석 (키워드 기반)
function analyzeEmotion(text) {
  const lowerText = text.toLowerCase();
  let positiveScore = 0;
  let negativeScore = 0;
  
  // 긍정 키워드 점수
  EMOTION_KEYWORDS.POSITIVE.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      positiveScore += 1;
    }
  });
  
  // 부정 키워드 점수
  EMOTION_KEYWORDS.NEGATIVE.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      negativeScore += 1;
    }
  });
  
  const totalScore = positiveScore - negativeScore;
  let sentiment = SENTIMENT_TYPES.NEUTRAL;
  let confidence = 0.5;
  
  if (totalScore > 0) {
    sentiment = SENTIMENT_TYPES.POSITIVE;
    confidence = Math.min(0.5 + (totalScore * 0.2), 1.0);
  } else if (totalScore < 0) {
    sentiment = SENTIMENT_TYPES.NEGATIVE;
    confidence = Math.min(0.5 + (Math.abs(totalScore) * 0.2), 1.0);
  }
  
  return {
    sentiment,
    score: totalScore,
    confidence: Math.round(confidence * 100) / 100,
    positiveWords: positiveScore,
    negativeWords: negativeScore
  };
}

// 주제 추출
function extractTopics(text) {
  const lowerText = text.toLowerCase();
  const foundTopics = [];
  
  Object.entries(TOPIC_KEYWORDS).forEach(([topic, keywords]) => {
    const matchCount = keywords.filter(keyword => 
      lowerText.includes(keyword)
    ).length;
    
    if (matchCount > 0) {
      foundTopics.push({
        topic,
        relevance: matchCount,
        confidence: Math.min(matchCount * 0.3, 1.0)
      });
    }
  });
  
  // 관련성 순으로 정렬
  foundTopics.sort((a, b) => b.relevance - a.relevance);
  
  return foundTopics.length > 0 ? foundTopics : [
    { topic: '일반', relevance: 1, confidence: 0.5 }
  ];
}

// 관심도 계산
function calculateInterestLevel(text, context = {}) {
  let score = 0;
  
  // 텍스트 길이 기반 점수
  const length = text.length;
  score += Math.min(length / 30, 3); // 최대 3점
  
  // 이모지 사용 점수
  const emojis = extractEmojis(text);
  score += Math.min(emojis.length * 0.5, 2); // 최대 2점
  
  // 질문 포함 점수
  if (text.includes('?') || text.includes('？')) {
    score += 1;
  }
  
  // 감탄사 점수
  if (text.includes('!') || text.includes('！')) {
    score += 0.5;
  }
  
  // 개인적인 내용 점수
  const personalWords = ['나', '내', '저', '제', '우리', '내가', '나는'];
  if (personalWords.some(word => text.includes(word))) {
    score += 1;
  }
  
  // 시간 관련 점수 (최근성)
  const timeWords = ['오늘', '지금', '방금', '현재', '이번'];
  if (timeWords.some(word => text.includes(word))) {
    score += 0.5;
  }
  
  // 점수를 0-10 범위로 정규화
  const normalizedScore = Math.min(score * 1.2, 10);
  
  // 관심도 레벨 결정
  let level = 'MEDIUM';
  Object.entries(INTEREST_LEVELS).forEach(([levelKey, levelData]) => {
    if (normalizedScore >= levelData.min && normalizedScore < levelData.max) {
      level = levelKey;
    }
  });
  
  return {
    score: Math.round(normalizedScore * 10) / 10,
    level,
    label: INTEREST_LEVELS[level].label,
    factors: {
      length: Math.min(length / 30, 3),
      emojis: Math.min(emojis.length * 0.5, 2),
      questions: text.includes('?') ? 1 : 0,
      exclamations: text.includes('!') ? 0.5 : 0,
      personal: personalWords.some(word => text.includes(word)) ? 1 : 0,
      timely: timeWords.some(word => text.includes(word)) ? 0.5 : 0
    }
  };
}

// 응답 시간 분석
function analyzeResponseTime(messages) {
  if (messages.length < 2) {
    return { avgResponseTime: 0, pattern: 'insufficient_data' };
  }
  
  const responseTimes = [];
  
  for (let i = 1; i < messages.length; i++) {
    const prevTime = new Date(messages[i - 1].timestamp);
    const currTime = new Date(messages[i].timestamp);
    const diff = currTime - prevTime;
    
    // 1분 이상 24시간 이하의 응답만 고려
    if (diff >= 60000 && diff <= 86400000) {
      responseTimes.push(diff);
    }
  }
  
  if (responseTimes.length === 0) {
    return { avgResponseTime: 0, pattern: 'no_valid_responses' };
  }
  
  const avgTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  
  let pattern = 'normal';
  if (avgTime < 300000) pattern = 'very_fast'; // 5분 미만
  else if (avgTime < 1800000) pattern = 'fast'; // 30분 미만
  else if (avgTime < 7200000) pattern = 'normal'; // 2시간 미만
  else if (avgTime < 21600000) pattern = 'slow'; // 6시간 미만
  else pattern = 'very_slow'; // 6시간 이상
  
  return {
    avgResponseTime: Math.round(avgTime / 1000), // 초 단위
    avgResponseTimeFormatted: formatDuration(avgTime),
    pattern,
    totalResponses: responseTimes.length
  };
}

// 시간 간격을 읽기 쉬운 형태로 변환
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}일 ${hours % 24}시간`;
  if (hours > 0) return `${hours}시간 ${minutes % 60}분`;
  if (minutes > 0) return `${minutes}분 ${seconds % 60}초`;
  return `${seconds}초`;
}

// 배열을 안전하게 섞기
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 객체에서 null/undefined 값 제거
function removeEmptyValues(obj) {
  const cleaned = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      cleaned[key] = value;
    }
  });
  return cleaned;
}

// 안전한 JSON 파싱
function safeJsonParse(str, defaultValue = null) {
  try {
    return JSON.parse(str);
  } catch (error) {
    return defaultValue;
  }
}

// 디바운스 함수
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

module.exports = {
  validateMessage,
  isValidUUID,
  generateRoomId,
  generateMessageId,
  formatDate,
  getRelativeTime,
  extractEmojis,
  analyzeTextLength,
  analyzeEmotion,
  extractTopics,
  calculateInterestLevel,
  analyzeResponseTime,
  formatDuration,
  shuffleArray,
  removeEmptyValues,
  safeJsonParse,
  debounce
};