export type TypeRootStackNavigationParams = {
  BottomTab: {
    screen?: keyof TypeBottomTabNavigationParams;
  };
  ConnectDetail: { parentId: number };
  Signup: undefined;
  Signin: undefined;
  FindPassword: undefined;
  Meal: undefined;
  Inquiry: undefined;
  Help: undefined;
};

export type TypeBottomTabNavigationParams = {
  Connect: {
    screen?: keyof TypeConnectStackNavigationParams;
  };
  Chat: undefined;
};

export type TypeConnectStackNavigationParams = {
  ConnectList: undefined;
};

export interface Post {
  id: number; // 게시글 ID
  title: string; // 제목
  content: string; // 내용
  category: string; // 카테고리
  commentCount: number; // 댓글 갯수
  userId: string; // 작성자 ID
  userName: string; // 작성자 이름
  insertDts: string; // 등록일
  deadlineDts: string; // 마감일
  destination: string; // 목적지
  maxCapacity: number; // 최대 모집 인원
  currentParticipants: number; // 모집 인원
  replies?: Reply[]; // 댓글
}

export interface Reply {
  id: number; // 댓글/대댓글 고유 ID
  userId: string; // 댓글 작성자 ID
  userName: string; // 이름
  title: string | null; // 타이틀
  content: string; // 내용
  insertDts: string; // 작성일
  parentId?: number; // 대댓글인 경우 부모 댓글 ID
  replies?: Reply[]; // 대댓글 배열 (선택적)
}

export interface User {
  userId: string;
  email: string;
  name: string;
  profileUrl?: string;
}

export interface CreateCommentRequest {
  parentId?: number | null; // 대댓글인 경우 부모 댓글 ID
  userId: string;
  userName: string;
  title?: string | null; // 일반 댓글인 경우 사용 (대댓글은 null)
  content: string;
}

export interface ReplyDto {
  id: number;
  postId: number;
  userId: string;
  userName: string;
  title: string | null;
  content: string;
  insertDts: string;
  parentReplyId: number | null;
  replies?: ReplyDto[];
}

// 개선/버그 요청(문의). 서버 InquiryType / InquiryStatus 와 값을 맞춘다.
export type InquiryType = "IMPROVEMENT" | "BUG" | "ETC";
export type InquiryStatus = "RECEIVED" | "IN_PROGRESS" | "ANSWERED" | "REJECTED";

export interface Inquiry {
  id: number;
  type: InquiryType;
  typeLabel: string; // "개선 요청" 등 서버가 내려주는 한글 라벨
  title: string;
  content: string;
  status: InquiryStatus;
  statusLabel: string;
  answer: string | null; // 관리자 답변 (없으면 null)
  answeredBy: string | null;
  answeredDts: string | null;
  userId: string | null; // 로그인 없이 보낸 요청이면 null
  userName: string; // 로그인 없이 보낸 요청이면 "비회원"
  guest: boolean; // 로그인 없이 보낸 요청인지
  guestEmail: string | null; // 비로그인 접수 때 답변받을 주소로 남긴 메일 (선택)
  insertDts: string;
  updateDts: string;
}

export interface ConnectDetailBoardDto {
  title: string;
  content: string;
  userId: string;
  userName: string;
  insertDts: string;
}