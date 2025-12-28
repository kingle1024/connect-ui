import Constants from "expo-constants";
import { useCallback, useMemo, useState } from "react";
import { ConnectDetailBoardDto, Post } from "@/types";
import axios from "axios";

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? "";
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

export const useDetailBoard = () => {

  const [boardDetail, setBoardDetail] = useState<ConnectDetailBoardDto | null>(null); // ✨ 단일 게시글 상세 정보
  const [loadingBoardDetail, setLoadingBoardDetail] = useState(false); // ✨ 상세 로딩 상태
  const [boardDetailError, setBoardDetailError] = useState<string | null>(null); // ✨ 상세 에러 상태

  const loadBoardDetail = useCallback(async (id: number) => {
    setLoadingBoardDetail(true);
    setBoardDetailError(null);
    setBoardDetail(null); // 로딩 전에 기존 상세 정보 초기화

    try {
      const response = await axiosInstance.get<ConnectDetailBoardDto>(`/api/boards/${id}`);
      setBoardDetail(response.data);
    } catch (error: any) {
      console.error(`게시글 ID ${id} 상세 로드 실패:`, error);
      setBoardDetailError(error.message || "게시글 상세 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoadingBoardDetail(false);
    }
  }, []);
  
  return {
    boardDetail,
    loadingBoardDetail,
    boardDetailError,
    loadBoardDetail,
  };
};
