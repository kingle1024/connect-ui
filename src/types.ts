export interface Post {
  id: number;
  title: string;
  content: string;
  category: string;
  comments: number;
  author: string;
}

export interface Comment {
  id: number;
  userId: string;
  comment: string;
  postId: number;
}
