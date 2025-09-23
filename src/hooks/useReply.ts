import { POSTS, REPLY } from "@/mock/data";
import { Post, Reply } from "@/types";
import { useState } from "react";

export const useReply = () => {
  const [replies, setReplies] = useState<Reply[]>();

  const fetchReply = () => {
    setReplies(REPLY);
  };

  return {
    replies,
    setReplies,
    fetchReply,
  };
};
