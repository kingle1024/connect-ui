import { REPLY } from "@/mock/data";
import { Reply } from "@/types";
import { useCallback, useMemo, useState } from "react";

export const useReply = () => {
  const [reply, setReply] = useState<Reply>(REPLY);
  const [replyInput, setReplyInput] = useState<string>("");

  const loadReply = useCallback((parentId: number) => {}, []);

  const replyInputErrorText = useMemo(() => {
    if (replyInput.length === 0) {
      return "댓글을 입력해주세요.";
    }
    return null;
  }, [replyInput]);

  return {
    reply,
    setReply,
    loadReply,
    replyInput,
    setReplyInput,
    replyInputErrorText,
  };
};
