import { NavigationContainer } from '@react-navigation/native'; // 내비게이션 컨테이너
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; // 하단 탭 내비게이션
import RecruitScreen from './src/screens/connectScreen/index.js'; // 경로는 프로젝트 구조에 따라 변경
import ChatScreen from './src/screens/ChatScreen.js';
import MyPageScreen from './src/screens/MyPageScreen';

const Tab = createBottomTabNavigator(); // 탭 내비게이터 생성

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: 'tomato', // 활성화된 탭 색상
          tabBarInactiveTintColor: 'gray', // 비활성화된 탭 색상
          tabBarStyle: {
            height: 60, // 탭 바 높이 조정
            paddingBottom: 10, // 아이폰 노치 대비 패딩
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: 'bold',
          },
        }}
      >
        <Tab.Screen
          name="모집"
          component={RecruitScreen} // 이제 RecruitScreen에 기존 앱 내용이 들어가 있으니!
          options={{
            headerShown: false,
          }}
        />
        <Tab.Screen
          name="채팅"
          component={ChatScreen}
          options={{
            headerShown: false,
          }}
        />
        <Tab.Screen
          name="마이페이지"
          component={MyPageScreen}
          options={{
            headerShown: false,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
