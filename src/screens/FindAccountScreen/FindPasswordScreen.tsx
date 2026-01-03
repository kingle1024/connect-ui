import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from "expo-constants";

type RootStackParamList = {
  BottomTab: undefined;
  ConnectDetail: undefined;
  Signin: undefined;
  Signup: undefined;
  FindPassword: undefined;
  MyPage: undefined;  
  '채팅방 상세': undefined;
  // 다른 스크린들도 여기에 정의
};

type FindPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FindPassword'>;

// --- 가상의 API 호출 함수들 (!!! 실제로는 백엔드 API와 연동해야 합니다 !!!) ---
// 이 함수들은 백엔드 로직이 필요하며, 보안을 위해 클라이언트에서 직접 처리하면 안 됩니다.
const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || "";

const sendVerificationCodeAPI = async (email: string): Promise<boolean> => {
  console.log(`Sending verification code to backend for email: ${email}`);
  try {
    const response = await axios.post(`${API_BASE_URL}/api/account/find-password/send-code`, { email });
    
    // 백엔드의 ApiResponse 구조에 따라 성공 여부를 판단
    if (response.data.success) {
      console.log(`Verification code sent successfully for ${email}. Message: ${response.data.message}`);
      return true;
    } else {
      // 백엔드에서 success: false로 응답을 보냈을 경우
      throw new Error(response.data.message || '인증번호 전송에 실패했습니다.');
    }
  } catch (error: any) {
    console.error('Error sending verification code:', error.response?.data || error.message);
    if (error.response?.data?.message) {
        throw new Error(error.response.data.message); // 백엔드에서 전달된 오류 메시지 사용
    }
    // 네트워크 오류, 서버 응답 없음 등 처리
    throw new Error('네트워크 오류가 발생했거나 서버에 연결할 수 없습니다. 다시 시도해주세요.');
  }
};

const verifyCodeAPI = async (email: string, code: string): Promise<boolean> => {
    console.log(`Verifying code ${code} for email: ${email} with backend.`);
    try {
        const response = await axios.post(`${API_BASE_URL}/api/account/find-password/verify-code`, { email, code });
        if (response.data.success) {
            console.log(`Verification successful for ${email}. Message: ${response.data.message}`);
            return true;
        } else {
            throw new Error(response.data.message || '인증번호 확인에 실패했습니다.');
        }
    } catch (error: any) {
        console.error('Error verifying code:', error.response?.data || error.message);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error('네트워크 오류가 발생했거나 서버에 연결할 수 없습니다. 다시 시도해주세요.');
    }
};

const resetPasswordAPI = async (email: string, newPassword: string): Promise<boolean> => {
    console.log(`Resetting password for email: ${email} with backend.`);
    try {
        const response = await axios.post(`${API_BASE_URL}/api/account/find-password/reset-password`, { email, newPassword });
        if (response.data.success) {
            console.log(`Password reset successful for ${email}. Message: ${response.data.message}`);
            return true;
        } else {
            throw new Error(response.data.message || '비밀번호 재설정에 실패했습니다.');
        }
    } catch (error: any) {
        console.error('Error resetting password:', error.response?.data || error.message);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error('네트워크 오류가 발생했거나 서버에 연결할 수 없습니다. 다시 시도해주세요.');
    }
};

const FindPasswordScreen = () => {
  const navigation = useNavigation<FindPasswordScreenNavigationProp>();

  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [stage, setStage] = useState<'email' | 'verifyCode' | 'resetPassword'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendCode = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!email.trim() || !email.includes('@')) {
        throw new Error('유효한 이메일 주소를 입력해주세요.');
      }
      await sendVerificationCodeAPI(email);
      Alert.alert('성공', '인증번호가 이메일로 발송되었습니다.');
      setStage('verifyCode');
    } catch (e: any) {
      setError(e.message || '인증번호 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!verificationCode.trim() || verificationCode.length !== 6) { // 예시: 6자리 코드
        throw new Error('유효한 6자리 인증번호를 입력해주세요.');
      }
      await verifyCodeAPI(email, verificationCode);
      Alert.alert('성공', '인증번호가 확인되었습니다. 새 비밀번호를 설정해주세요.');
      setStage('resetPassword');
    } catch (e: any) {
      setError(e.message || '인증번호 확인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    setLoading(true);
    try {
      // 클라이언트 측 비밀번호 유효성 검사 (백엔드에서도 반드시 수행해야 함)
      if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*()]/.test(newPassword)) {
        throw new Error('비밀번호는 8자 이상이며, 영문, 숫자, 특수문자를 포함해야 합니다.');
      }
      if (newPassword !== confirmPassword) {
        throw new Error('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      }

      await resetPasswordAPI(email, newPassword);
      Alert.alert('성공', '비밀번호가 성공적으로 변경되었습니다. 로그인해주세요.');
      navigation.navigate('Signin'); // 로그인 화면으로 이동
    } catch (e: any) {
      setError(e.message || '비밀번호 재설정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>비밀번호 찾기</Text>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* 1단계: 이메일 입력 */}
        {stage === 'email' && (
          <View style={styles.stageContainer}>
            <Text style={styles.label}>이메일 주소</Text>
            <TextInput
              style={styles.input}
              placeholder="가입 시 사용한 이메일을 입력해주세요."
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendCode}
              disabled={loading || !email.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>인증번호 전송</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* 2단계: 인증번호 확인 */}
        {stage === 'verifyCode' && (
          <View style={styles.stageContainer}>
            <Text style={styles.label}>인증번호</Text>
            <TextInput
              style={styles.input}
              placeholder="이메일로 전송된 인증번호를 입력하세요."
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="numeric"
              maxLength={6} // 예시: 6자리 인증번호
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyCode}
              disabled={loading || !verificationCode.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>인증번호 확인</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStage('email')} style={styles.linkButton}>
              <Text style={styles.linkText}>이메일 다시 입력하기</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 3단계: 새 비밀번호 설정 */}
        {stage === 'resetPassword' && (
          <View style={styles.stageContainer}>
            <Text style={styles.label}>새 비밀번호</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="새 비밀번호를 입력해주세요 (8자 이상)"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeIcon}>
                <Ionicons name={showNewPassword ? "eye" : "eye-off"} size={20} color="gray" />
              </TouchableOpacity>
            </View>
            <Text style={styles.passwordHint}>8자 이상, 영문, 숫자, 특수문자를 포함해야 합니다.</Text>

            <Text style={styles.label}>새 비밀번호 확인</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="새 비밀번호를 다시 입력해주세요."
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <Ionicons name={showConfirmPassword ? "eye" : "eye-off"} size={20} color="gray" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading || !newPassword.trim() || !confirmPassword.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>비밀번호 재설정</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStage('email')} style={styles.linkButton}>
              <Text style={styles.linkText}>처음부터 다시 시작</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'center', // 세로 중앙 정렬
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: Platform.OS === 'ios' ? 0 : 20, // iOS는 상단에 Safe Area 고려
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
  },
  stageContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    alignSelf: 'flex-start',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    paddingRight: 10, // 아이콘과의 간격
  },
  eyeIcon: {
    padding: 5,
  },
  passwordHint: {
    fontSize: 12,
    color: 'gray',
    alignSelf: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#007bff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#a0c7ff',
  },
  linkButton: {
    marginTop: 20,
    padding: 5,
  },
  linkText: {
    color: '#007bff',
    fontSize: 14,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
  },
});

export default FindPasswordScreen;