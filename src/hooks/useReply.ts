import { useState, useCallback, useContext } from "react";
import axios from "axios"; // axios 라이브러리 임포트
import { Reply, CreateCommentRequest, ReplyDto } from "@/types"; // 새로 정의한 타입 임포트
import AuthContext from "@/components/auth/AuthContext"; // 사용자 정보를 가져오기 위함
import Constants from "expo-constants";
import Alert from '@blazejkustra/react-native-alert';
import axiosInstance from "@/utils/api";
import dayjs from "dayjs";

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL;
export const useReply = () => {
  // 로그인하지 않았어도 댓글을 쓸 수 있다. 이때는 쿠키로 식별되는 게스트가 작성자가 된다.
  const { ensureActor } = useContext(AuthContext);
  const [reply, setReply] = useState<Reply[] | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [replyInputErrorText, setReplyInputErrorText] = useState<string | null>(null); // 에러 메시지 상태 추가

  // 특정 부모 게시글/댓글의 댓글 목록을 로드하는 함수
  const loadReply = useCallback(async (parentId: number) => {
    try {
      const response = await axios.get<ReplyDto[]>(`${API_BASE_URL}/api/boards/${parentId}/comments`); // 또는 특정 게시글의 모든 댓글을 불러오는 엔드포인트
      console.log("댓글 로드 성공:", response.data);
      setReply(response.data);
    } catch (error) {
      console.error("댓글 로드 실패:", error);
    }
  }, [setReply]);
  // 댓글 또는 대댓글을 서버에 제출하는 함수
  const submitReply = useCallback(
    async (boardId: number, parentReplyId: number | null, content: string) => {
      const me = await ensureActor();
      if (!me) {
        setReplyInputErrorText("작성자 정보를 준비하지 못했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }
      if (!content.trim()) {
        setReplyInputErrorText("댓글 내용을 입력해주세요.");
        return;
      }

      setReplyInputErrorText(null); // 에러 메시지 초기화

      // 응답을 기다리지 않고 바로 목록에 그린다(낙관적 업데이트).
      // 서버 id 와 겹치지 않게 음수 임시 id 를 쓰고, 실패하면 이 항목만 걷어낸다.
      const tempId = -Date.now();
      const optimistic: Reply = {
        id: tempId,
        userId: me.userId,
        userName: me.name,
        title: null,
        content,
        insertDts: dayjs().format("YYYY-MM-DDTHH:mm:ss"),
        replies: [],
        pending: true,
      };
      setReply((prev) => {
        const list = prev ?? [];
        if (parentReplyId === null) return [...list, optimistic];
        return list.map((r) =>
          r.id === parentReplyId ? { ...r, replies: [...(r.replies ?? []), optimistic] } : r
        );
      });
      setReplyInput("");

      // 임시 항목을 바꾸거나(성공) 걷어낸다(실패). 다른 임시 항목은 건드리지 않는다.
      const replaceTemp = (next: Reply | null) =>
        setReply((prev) =>
          (prev ?? []).flatMap((r) => {
            if (r.id === tempId) return next ? [next] : [];
            if (!r.replies?.some((c) => c.id === tempId)) return [r];
            return [
              {
                ...r,
                replies: r.replies.flatMap((c) => (c.id === tempId ? (next ? [next] : []) : [c])),
              },
            ];
          })
        );

      try {
        const requestBody: CreateCommentRequest = {
          parentId: parentReplyId,
          userId: me.userId || me.email, // 사용자의 고유 ID (userId가 있다면 우선 사용)
          userName: me.name, // 사용자의 표시 이름
          content: content,
          // title은 서비스 로직에 따라 일반 댓글에만 사용되거나 null일 수 있으므로 유동적으로 처리
          title: parentReplyId === null ? "" : null, // 일반 댓글인 경우 비어있는 문자열, 대댓글인 경우 null
        };

        // 작성자는 서버가 로그인 토큰/게스트 쿠키로 정한다. 둘 다 실리도록 공용 axiosInstance 로 보낸다.
        const response = await axiosInstance.post<ReplyDto>(
          `/api/boards/${boardId}/comments`,
          requestBody
        );

        console.log("댓글/대댓글 등록 성공:", response.data);
        // 다시 불러오지 않고 임시 항목만 서버 값으로 바꾼다 (재조회하면 아직 응답 안 온 다른 임시 댓글이 사라진다)
        replaceTemp({ ...response.data, parentId: parentReplyId ?? undefined, replies: [] });

        return response.data; // 성공 시 응답 데이터 반환
      } catch (error: any) {
        console.error("댓글/대댓글 등록 실패:", error);
        replaceTemp(null);
        // 쓴 글은 잃지 않게 입력창으로 돌려놓는다 (그 사이 새로 입력 중이면 건드리지 않는다)
        setReplyInput((cur) => (cur.trim() ? cur : content));
        const serverMessage =
          typeof error?.response?.data === "string"
            ? error.response.data
            : error?.response?.data?.message;
        const message = serverMessage || "댓글 등록에 실패했습니다. 다시 시도해주세요.";
        setReplyInputErrorText(message);
        Alert.alert("댓글 등록 실패", message);
        throw error; // 에러를 호출자에게 다시 던져 처리할 수 있도록 합니다.
      }
    },
    [ensureActor]
  );

  const deleteComment = useCallback(async (boardId: number, replyId: number) => {
    Alert.alert(
      "댓글 삭제",
      "정말로 이 댓글을 삭제하시겠습니까? 관련 대댓글도 모두 삭제됩니다.",
      [
        {
          text: "취소",
          style: "cancel"
        },
        {
          text: "삭제",
          onPress: async () => {
            try {
              const requestUrl = `${API_BASE_URL}/api/boards/${boardId}/comments/${replyId}`;
              console.log("deleteComment - Calling API:", requestUrl);

              await axiosInstance.delete(requestUrl);
              console.log(`댓글 ID ${replyId} 삭제 성공`);

              Alert.alert("알림", "댓글이 삭제되었습니다.");
              await loadReply(boardId);

            } catch (error: any) {
              console.error(`댓글 ID ${replyId} 삭제 실패:`, error);
              Alert.alert("오류", error.response?.data?.message || "댓글 삭제에 실패했습니다.");
            }
          },
          style: "destructive"
        }
      ],
      { cancelable: false }
    );
  }, [loadReply]);

  return {
    reply,
    loadReply,
    replyInput,
    setReplyInput,
    replyInputErrorText,
    submitReply,
    deleteComment,
  };
};