import dayjs, { Dayjs } from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";

dayjs.extend(relativeTime);
dayjs.locale("ko");

/**
 * insertDts(ISO 문자열)을 받아서 "5분 전", "2일 전" 등으로 변환
 */
export function formatRelativeTime(insertDts: string): string {
  return dayjs(insertDts).fromNow();
}

export function getDeadlineLabel(now: Dayjs, deadlineDts: string) {
  const end = dayjs(deadlineDts);

  // 시간 차이 (밀리초 → 일 단위)
  const diffTime = end.toDate().getTime() - now.toDate().getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: "마감됨", status: "closed" };
  }
  if (diffDays === 0) {
    const hours = Math.floor((diffTime / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diffTime / (1000 * 60)) % 60);
    const seconds = Math.floor((diffTime / 1000) % 60);

    const parts = [];
    if (hours > 0) parts.push(`${hours}시간`);
    if (minutes > 0) parts.push(`${minutes}분`);
    parts.push(`${seconds}초`);

    return { label: `오늘 마감 (${parts.join(" ")})`, status: "today" };
  }
  return {
    label: `마감일: ${end.format("YYYY-MM-DD (ddd)")}`,
    status: "future",
  };
}
