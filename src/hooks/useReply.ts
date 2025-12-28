import { useState, useCallback, useContext } from "react";
import axios from "axios"; // axios 라이브러리 임포트
import { Reply, CreateCommentRequest, ReplyDto } from "@/types"; // 새로 정의한 타입 임포트
import AuthContext from "@/components/auth/AuthContext"; // 사용자 정보를 가져오기 위함
import Constants from "expo-constants";
import Alert from '@blazejkustra/react-native-alert';
import axiosInstance from "@/utils/api";

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL;
export const useReply = () => {
  const { user: me } = useContext(AuthContext); // 로그인한 사용자 정보
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
      if (!me) {
        setReplyInputErrorText("로그인이 필요합니다.");
        return;
      }
      if (!content.trim()) {
        setReplyInputErrorText("댓글 내용을 입력해주세요.");
        return;
      }

      setReplyInputErrorText(null); // 에러 메시지 초기화

      try {
        const requestBody: CreateCommentRequest = {
          parentId: parentReplyId,
          userId: me.userId || me.email, // 사용자의 고유 ID (userId가 있다면 우선 사용)
          userName: me.name, // 사용자의 표시 이름
          content: content,
          // title은 서비스 로직에 따라 일반 댓글에만 사용되거나 null일 수 있으므로 유동적으로 처리
          title: parentReplyId === null ? "" : null, // 일반 댓글인 경우 비어있는 문자열, 대댓글인 경우 null
        };

        const response = await axios.post<ReplyDto>(
          `${API_BASE_URL}/api/boards/${boardId}/comments`,
          requestBody
        );

        console.log("댓글/대댓글 등록 성공:", response.data);
        setReplyInput("");
        loadReply(boardId);

        return response.data; // 성공 시 응답 데이터 반환
      } catch (error) {
        console.error("댓글/대댓글 등록 실패:", error);
        setReplyInputErrorText("댓글 등록 중 오류가 발생했습니다.");
        throw error; // 에러를 호출자에게 다시 던져 처리할 수 있도록 합니다.
      }
    },
    [me, loadReply] // me (사용자 정보)와 loadReply가 변경될 때 함수 재생성
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