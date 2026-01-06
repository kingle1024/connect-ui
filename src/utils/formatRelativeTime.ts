import dayjs, { Dayjs } from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";
import duration from 'dayjs/plugin/duration';
dayjs.extend(relativeTime);
dayjs.locale("ko");
dayjs.extend(duration);

export function formatRelativeTime(insertDts: string): string {
  return dayjs(insertDts).fromNow();
}
interface DeadlineInfo {
  label: string;
  status: 'closed' | 'today' | 'future';
}

export function getDeadlineLabel(now: Dayjs, deadlineDts: string): DeadlineInfo {
  const endOfDeadlineDay = dayjs(deadlineDts).endOf('day'); // 마감일의 23:59:59로 설정
  const startOfToday = now.startOf('day');                   // 오늘 날짜의 00:00:00으로 설정
  const startOfDeadlineDay = dayjs(deadlineDts).startOf('day'); // 마감일 날짜의 00:00:00으로 설정

  // 1. 날짜만으로 남은 일수 계산 (현재 시간의 자정과 마감일의 자정 비교)
  // 마감일이 오늘보다 이전이면 (즉, 오늘 날짜가 마감일을 이미 지나쳤다면)
  const diffDays = startOfDeadlineDay.diff(startOfToday, 'day');

  if (diffDays < 0) {
    // 마감일이 이미 지난 경우
    return { label: "마감됨", status: "closed" };
  } else if (diffDays === 0) {
    // 오늘이 마감일인 경우, 정확한 시간 계산
    const diffTimeMilliseconds = endOfDeadlineDay.diff(now); // 현재 시각과 마감일 23:59:59와의 차이

    if (diffTimeMilliseconds <= 0) {
      // 마감일 23:59:59가 현재 시각보다 이미 지났으면 '마감됨'
      return { label: "마감됨", status: "closed" };
    }

    const duration = dayjs.duration(diffTimeMilliseconds); // 밀리초를 Dayjs Duration 객체로 변환

    const hours = Math.floor(duration.asHours()); // 전체 시간
    const minutes = duration.minutes();
    const seconds = duration.seconds();

    const parts = [];
    if (hours > 0) parts.push(`${hours}시간`);
    if (minutes > 0) parts.push(`${minutes}분`);
    // 초는 0이라도 항상 표시하여 "0초"를 보여줄 수 있게 합니다.
    // 하지만 "1시간 0분 0초"는 어색할 수 있으므로, 최소한의 정보만 표시하는 로직을 적용합니다.
    if (seconds > 0 || (hours === 0 && minutes === 0)) parts.push(`${seconds}초`);


    // parts가 비어있는 경우 (예: 시간이 매우 짧아 모두 0으로 계산되었을 때) 예외 처리
    if (parts.length === 0 && diffTimeMilliseconds > 0) {
      return { label: `오늘 마감 (몇 초 이내)`, status: "today" };
    } else if (parts.length === 0 && diffTimeMilliseconds <= 0){
      return { label: "마감됨", status: "closed" };
    }
    
    return { label: `오늘 마감 (${parts.join(" ")})`, status: "today" };

  } else {
    // 마감일이 미래인 경우
    return {
      label: `마감일: ${dayjs(deadlineDts).format("YYYY-MM-DD (ddd)")}`,
      status: "future",
    };
  }
}