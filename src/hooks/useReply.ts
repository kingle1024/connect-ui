import { REPLY } from "@/mock/data";
import { Reply } from "@/types";
import { useMemo, useState } from "react";

export const useReply = () => {
  const [replies, setReplies] = useState<Reply[]>();
  const [replyInput, setReplyInput] = useState<string>("");

  const replyInputErrorText = useMemo(() => {
    if (replyInput.length === 0) {
      return "댓글을 입력해주세요.";
    }
    return null;
  }, [replyInput]);

  const fetchReply = () => {
    setReplies(REPLY);
  };

  return {
    replies,
    setReplies,
    fetchReply,
    replyInput,
    setReplyInput,
    replyInputErrorText,
  };
};
