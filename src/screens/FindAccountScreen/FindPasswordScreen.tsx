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
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import styles from "./FindPasswordScreen.styles";

type RootStackParamList = {
  BottomTab: undefined;
  ConnectDetail: undefined;
  Signin: undefined;
  Signup: undefined;
  FindPassword: undefined;
  MyPage: undefined;  
  '채팅방 상세': undefined;
};

type FindPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FindPassword'>;

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || "";

const sendVerificationCodeAPI = async (email: string): Promise<boolean> => {
  console.log(`Sending verification code to backend for email: ${email}`);
  try {
    const response = await axios.post(`${API_BASE_URL}/api/account/find-password/send-code`, { email });
    
    if (response.data.success) {
      console.log(`Verification code sent successfully for ${email}. Message: ${response.data.message}`);
      return true;
    } else {
      throw new Error(response.data.message || '인증번호 전송에 실패했습니다.');
    }
  } catch (error: any) {
    console.error('Error sending verification code:', error.response?.data || error.message);
    if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
    }
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

  const onPressBackButton = () => {
    try {
      const canGoBack = typeof navigation.canGoBack === "function" ? navigation.canGoBack() : false;
      if (canGoBack) {
        navigation.goBack();
        return;
      }
    } catch (err) {
      console.log("[FindPassword] canGoBack check error", err);
    }

    if (Platform.OS === 'web') {
      try {
        // @ts-ignore
        window.history.back();
        return;
      } catch (e) {
        console.log('[FindPassword] window.history.back error', e);
      }
    }

    navigation.goBack();
  };

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
      if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*()]/.test(newPassword)) {
        throw new Error('비밀번호는 8자 이상이며, 영문, 숫자, 특수문자를 포함해야 합니다.');
      }
      if (newPassword !== confirmPassword) {
        throw new Error('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      }

      await resetPasswordAPI(email, newPassword);
      Alert.alert('성공', '비밀번호가 성공적으로 변경되었습니다. 로그인해주세요.');
      navigation.navigate('Signin');
    } catch (e: any) {
      setError(e.message || '비밀번호 재설정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <View style={styles.backButton}>
              {navigation.canGoBack() && (
                <TouchableOpacity
                  onPress={onPressBackButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons
                    name="arrow-back-ios-new"
                    size={24}
                    color="black"
                  />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.center}>
              <Text style={styles.headerTitle}>비밀번호 찾기</Text>
            </View>
          </View>
        </View>
        {/* 1단계: 이메일 입력 */}
        {stage === 'email' && (
          <View style={styles.section}>
            <Text style={styles.title}>이메일</Text>
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
          <View style={styles.section}>
            <Text style={styles.title}>인증번호</Text>
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
            <View style={styles.signupButtonContainer}>
              <TouchableOpacity onPress={() => setStage('email')}>
                <Text style={{fontSize: 16}}>이메일 다시 입력하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 3단계: 새 비밀번호 설정 */}
        {stage === 'resetPassword' && (
          <View style={styles.section}>
            <Text style={styles.title}>새 비밀번호</Text>
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

            <Text style={styles.title}>새 비밀번호 확인</Text>
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
            <View style={styles.signupButtonContainer}>
              <TouchableOpacity onPress={() => setStage('email')}>
                <Text style={{fontSize: 16}}>처음부터 다시 시작</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default FindPasswordScreen;