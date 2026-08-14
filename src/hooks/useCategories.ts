import { useCallback, useState } from "react";
import axios from "axios";
import Constants from "expo-constants";

// 카테고리 목록은 서버(/api/boards/categories = 백오피스에서 관리하는 활성 카테고리)에서 받아온다.
// PRESETS는 응답이 비었거나 실패했을 때의 폴백일 뿐, 화면에 고정 노출되는 값이 아니다.
export const CATEGORY_PRESETS = ["같이타", "모임", "기타"];
export const CATEGORY_CUSTOM = "직접입력";
// 카테고리 필터에서 "전체"를 나타내는 값 (서버에 category 파라미터를 보내지 않음)
export const CATEGORY_FILTER_ALL = "전체";
// 직접입력으로 만든(=칩이 없는) 카테고리를 모아 보여주는 캐치올 카테고리.
// 서버 CategoryService.ETC_CATEGORY_NAME 과 같은 값이어야 한다.
export const CATEGORY_ETC = "기타";

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? "";
const axiosInstance = axios.create({ baseURL: API_BASE_URL });

/**
 * 글 작성/수정 폼과 목록 필터가 같은 카테고리 목록을 쓰도록 공유하는 훅.
 * 관리자가 정한 노출 순서를 그대로 따르므로 프리셋을 앞에 붙이지 않는다.
 */
export const useCategories = () => {
  const [categories, setCategories] = useState<string[]>(CATEGORY_PRESETS);

  // 갱신된 목록을 반환한다 (호출한 쪽에서 선택값을 보정할 수 있도록)
  const loadCategories = useCallback(async (): Promise<string[]> => {
    try {
      const { data } = await axiosInstance.get<string[]>("/api/boards/categories");
      const next = data && data.length > 0 ? data : CATEGORY_PRESETS;
      setCategories(next);
      return next;
    } catch (ex) {
      console.error(ex);
      return CATEGORY_PRESETS;
    }
  }, []);

  return { categories, loadCategories };
};
