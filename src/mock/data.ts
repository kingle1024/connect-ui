import { Comment, Post } from "@/types";

export const POSTS: Post[] = [
  {
    id: 1,
    title: "더존비즈온 -> 강변역",
    content: "9월 12일 강변역 같이타 구합니다.",
    category: "개발",
    comments: 1,
    author: "익명",
  },
  {
    id: 2,
    title: "더존비즈온 -> 강변역",
    content: "9월 13일 강촌역까지 사람 구합니다.",
    category: "개발",
    comments: 1,
    author: "익명",
  },
  {
    id: 3,
    title: "강촌역까지",
    content: "9월 13일 강촌역까지 사람 구합니다.",
    category: "개발",
    comments: 1,
    author: "익명",
  },
  {
    id: 4,
    title: "강변역까지",
    content: "9월 13일 강촌역까지 사람 구합니다.",
    category: "개발",
    comments: 1,
    author: "익명",
  },
  {
    id: 5,
    title: "을지로까지",
    content: "9월 13일 강촌역까지 사람 구합니다.",
    category: "개발",
    comments: 1,
    author: "익명",
  },
  {
    id: 6,
    title: "부산까지?",
    content: "9월 13일 강촌역까지 사람 구합니다.",
    category: "개발",
    comments: 1,
    author: "익명",
  },
  {
    id: 7,
    title: "오전반차입니다..강촌가실 분 구합니다.",
    content: "9월 13일 강촌역까지 사람 구합니다.",
    category: "개발",
    comments: 1,
    author: "익명",
  },
];

export const POST_COMMENTS: Comment[] = [
  {
    id: 1,
    userId: "HHY",
    comment: "여기 한 명 있습니다.",
    postId: 1,
  },
  {
    id: 2,
    userId: "UZY",
    comment: "여기 두 명 있습니다.",
    postId: 1,
  },
  {
    id: 3,
    userId: "UZY",
    comment: "여기 두 명 있습니다.",
    postId: 1,
  },
  {
    id: 4,
    userId: "UZY",
    comment: "여기 두 명 있습니다.",
    postId: 1,
  },
];
