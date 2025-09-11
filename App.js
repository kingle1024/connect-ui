import { NavigationContainer } from '@react-navigation/native'; // 내비게이션 컨테이너
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; // 하단 탭 내비게이션
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // 🌟 스택 내비게이터 임포트
import ConnectScreen from './src/screens/connectScreen/index.js'; // 경로는 프로젝트 구조에 따라 변경
import ChatScreen from './src/screens/chatScreen/EnterChatRoom.js';
import ChatRoomsListScreen from './src/screens/chatScreen/ChatRoomListScreen.js'; 
import MyPageScreen from './src/screens/MyPageScreen';
import { StyleSheet, Text, View, StatusBar } from 'react-native';

const Tab = createBottomTabNavigator(); // 탭 내비게이터 생성
const Stack = createNativeStackNavigator(); 

// 하단 탭 내비게이션을 담을 컴포넌트
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold', // 폰트 깨짐 현상이 있다면 이 부분을 제거해보세요!
        },
      }}
    >
      <Tab.Screen
        name="모집"
        component={ConnectScreen}
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="채팅"
        component={ChatRoomsListScreen}
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
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <Stack.Navigator>
        {/* MainTabNavigator를 기본 화면으로 설정. 여기에 하단 탭이 모두 포함됨 */}
        <Stack.Screen
          name="MainTabs"
          component={MainTabNavigator}
          options={{ headerShown: false }} // MainTabs에는 상단 헤더 숨김
        />
        {/* '채팅방 상세' 화면 - ChatRoomsListScreen이나 EnterRoomScreen에서 채팅방 들어갈 때 호출 */}
        <Stack.Screen
          name="채팅방 상세"
          component={ChatScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
