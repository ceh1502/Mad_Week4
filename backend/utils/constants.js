// 메시지 관련 상수
const MESSAGE_TYPES = {
  TEXT: 'text',
  EMOJI: 'emoji',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system'
};

const MESSAGE_LIMITS = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 1000,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  RATE_LIMIT: 10 // 초당 메시지 제한
};

// Socket 이벤트 이름
const SOCKET_EVENTS = {
  // 클라이언트 → 서버
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  SEND_MESSAGE: 'send-message',
  TYPING_START: 'typing-start',
  TYPING_STOP: 'typing-stop',
  MARK_READ: 'mark-read',
  
  // 서버 → 클라이언트
  ROOM_JOINED: 'room-joined',
  ROOM_LEFT: 'room-left',
  RECEIVE_MESSAGE: 'receive-message',
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  USER_TYPING: 'user-typing',
  MESSAGE_READ: 'message-read',
  ROOM_INFO: 'room-info',
  ANALYSIS_RESULT: 'analysis-result',
  ERROR: 'error'
};

// 분석 관련 상수
const ANALYSIS_TYPES = {
  SENTIMENT: 'sentiment',
  INTEREST_LEVEL: 'interest_level',
  TOPIC_EXTRACTION: 'topic_extraction',
  RESPONSE_SUGGESTION: 'response_suggestion',
  CONVERSATION_FLOW: 'conversation_flow'
};

const SENTIMENT_TYPES = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  NEUTRAL: 'neutral'
};

const INTEREST_LEVELS = {
  VERY_LOW: { min: 0, max: 2, label: '매우 낮음' },
  LOW: { min: 2, max: 4, label: '낮음' },
  MEDIUM: { min: 4, max: 6, label: '보통' },
  HIGH: { min: 6, max: 8, label: '높음' },
  VERY_HIGH: { min: 8, max: 10, label: '매우 높음' }
};

// 주제 카테고리
const TOPIC_CATEGORIES = {
  DAILY: '일상',
  FOOD: '음식',
  HOBBY: '취미',
  WORK: '일/공부',
  EMOTION: '감정',
  TRAVEL: '여행',
  RELATIONSHIP: '인간관계',
  ENTERTAINMENT: '엔터테인먼트',
  HEALTH: '건강',
  GENERAL: '일반'
};

// 감정 키워드
const EMOTION_KEYWORDS = {
  POSITIVE: [
    '좋', '행복', '최고', '사랑', '감사', '기쁘', '즐거', '신나', 
    '완벽', '대박', '멋지', '예쁘', '귀여', '재밌', '웃음',
    '😊', '😍', '🥰', '😄', '😆', '👍', '❤️', '💕', '🎉', '🔥'
  ],
  NEGATIVE: [
    '힘들', '싫', '화나', '우울', '슬프', '피곤', '스트레스', '짜증',
    '최악', '별로', '실망', '걱정', '불안', '무서', '아프',
    '😢', '😔', '😞', '😟', '😠', '😡', '💔', '😰', '😨', '😫'
  ],
  NEUTRAL: [
    '그냥', '보통', '일반', '평범', '괜찮', '무난', '그럭저럭'
  ]
};

// 주제별 키워드
const TOPIC_KEYWORDS = {
  [TOPIC_CATEGORIES.DAILY]: [
    '오늘', '어제', '내일', '하루', '아침', '점심', '저녁', '밤',
    '일상', '생활', '루틴', '시간', '날씨', '집', '가족'
  ],
  [TOPIC_CATEGORIES.FOOD]: [
    '밥', '음식', '맛있', '요리', '레스토랑', '카페', '커피', '차',
    '먹', '배고', '맛', '달달', '매워', '짜', '단', '신선'
  ],
  [TOPIC_CATEGORIES.HOBBY]: [
    '취미', '영화', '드라마', '음악', '게임', '운동', '독서', '책',
    '그림', '사진', '여행', '쇼핑', '요가', '헬스', '수영'
  ],
  [TOPIC_CATEGORIES.WORK]: [
    '회사', '업무', '일', '회의', '프로젝트', '동료', '상사', '출근',
    '퇴근', '야근', '학교', '공부', '시험', '과제', '수업'
  ],
  [TOPIC_CATEGORIES.EMOTION]: [
    '기분', '느낌', '생각', '마음', '감정', '심정', '상태', '컨디션',
    '멘탈', '힐링', '위로', '응원', '격려', '공감'
  ]
};

// API 응답 코드
const RESPONSE_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
};

// 에러 메시지
const ERROR_MESSAGES = {
  INVALID_MESSAGE: '올바르지 않은 메시지 형식입니다.',
  MESSAGE_TOO_LONG: `메시지는 ${MESSAGE_LIMITS.MAX_LENGTH}자를 초과할 수 없습니다.`,
  MESSAGE_TOO_SHORT: '메시지를 입력해주세요.',
  ROOM_NOT_FOUND: '채팅방을 찾을 수 없습니다.',
  USER_NOT_IN_ROOM: '채팅방에 입장하지 않았습니다.',
  RATE_LIMIT_EXCEEDED: '메시지 전송 속도가 너무 빠릅니다.',
  ANALYSIS_FAILED: '분석 중 오류가 발생했습니다.',
  AI_SERVICE_ERROR: 'AI 서비스 연결에 실패했습니다.',
  INVALID_ROOM_ID: '올바르지 않은 채팅방 ID입니다.',
  INVALID_USER_ID: '올바르지 않은 사용자 ID입니다.'
};

// 성공 메시지
const SUCCESS_MESSAGES = {
  ROOM_CREATED: '채팅방이 생성되었습니다.',
  ROOM_JOINED: '채팅방에 입장했습니다.',
  ROOM_LEFT: '채팅방에서 나갔습니다.',
  MESSAGE_SENT: '메시지가 전송되었습니다.',
  MESSAGE_SAVED: '메시지가 저장되었습니다.',
  ANALYSIS_COMPLETED: '분석이 완료되었습니다.',
  DATA_RETRIEVED: '데이터를 가져왔습니다.',
  DATA_UPDATED: '데이터가 업데이트되었습니다.',
  DATA_DELETED: '데이터가 삭제되었습니다.'
};

// 환경별 설정
const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test'
};

// 로그 레벨
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

module.exports = {
  MESSAGE_TYPES,
  MESSAGE_LIMITS,
  SOCKET_EVENTS,
  ANALYSIS_TYPES,
  SENTIMENT_TYPES,
  INTEREST_LEVELS,
  TOPIC_CATEGORIES,
  EMOTION_KEYWORDS,
  TOPIC_KEYWORDS,
  RESPONSE_CODES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ENVIRONMENTS,
  LOG_LEVELS
};