import Alert from "@blazejkustra/react-native-alert";

/**
 * 대화 상대(친구)가 없을 때 보여주는 안내. 채팅 탭의 + 버튼과 (비회원의) 친구 탭이 같이 쓴다.
 * 웹 Alert 는 버튼이 2개일 때만 첫 버튼을 강조하므로 '닫기' 를 함께 둔다.
 */
export function alertStartChatGuide(goToConnect: () => void) {
  Alert.alert(
    "대화를 시작하려면",
    "모집 탭에서 글을 열고 '대화하기' 버튼을 눌러 주세요.",
    [
      { text: "모집 보러 가기", onPress: goToConnect },
      { text: "닫기" },
    ]
  );
}
