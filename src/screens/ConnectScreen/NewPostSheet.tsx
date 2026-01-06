import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  PanResponder,
  StyleSheet,
} from 'react-native';
import CustomDateTimePicker from '../../components/CustomDateTimePicker';

interface NewPostSheetProps {
  screenHeight: number;
  pan: Animated.Value;
  panResponder: ReturnType<typeof PanResponder.create>; // PanResponder 타입
  onPressCancel: () => void;
  onPressPost: () => void;

  titleInput: string;
  setTitleInput: (text: string) => void;
  titleInputErrorText: string | null;
  validateTitle: () => boolean;

  contentInput: string;
  setContentInput: (text: string) => void;
  contentInputErrorText: string | null;
  validateContent: () => boolean;

  destinationInput: string;
  setDestinationInput: (text: string) => void;
  destinationInputErrorText: string | null;
  validateDestination: () => boolean;

  maxCapacityInput: string;
  setMaxCapacityInput: (text: string) => void;
  maxCapacityInputErrorText: string | null;
  validateMaxCapacity: () => boolean;

  deadlineDts: Date;
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
  handleDeadlineDtsChange: (event: any, selectedDate?: Date) => void;
}

const NewPostSheet: React.FC<NewPostSheetProps> = React.memo((props) => {
  const {
    screenHeight, pan, panResponder, onPressCancel, onPressPost,
    titleInput, setTitleInput, titleInputErrorText, validateTitle,
    contentInput, setContentInput, contentInputErrorText, validateContent,
    destinationInput, setDestinationInput, destinationInputErrorText, validateDestination,
    maxCapacityInput, setMaxCapacityInput, maxCapacityInputErrorText, validateMaxCapacity,
    deadlineDts, handleDeadlineDtsChange, showDatePicker, setShowDatePicker
  } = props;


  // TextInput 오류 여부에 따라 Post 버튼의 배경색 결정 (props로 받은 에러 텍스트 사용)
  const isPostButtonDisabled =
    titleInputErrorText || contentInputErrorText || destinationInputErrorText || maxCapacityInputErrorText;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
        <View style={styles.dragHandle} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled" // always에서 handled로 변경하여 포커스 이슈 개선 시도
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onPressCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>
          <Text style={styles.titleText}>새 글</Text>
          <TouchableOpacity
            style={{
              ...styles.postButton,
              backgroundColor: isPostButtonDisabled
                ? 'rgba(255, 99, 71, 0.5)'
                : 'rgba(255, 99, 71, 1)',
            }}
            onPress={onPressPost}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={!!isPostButtonDisabled} // disabled prop 추가
          >
            <Text style={styles.postButtonText}>Post</Text>
          </TouchableOpacity>
        </View>

        {/* 제목 */}
        <TextInput
          value={titleInput}
          placeholder="제목"
          onChangeText={setTitleInput}
          onBlur={validateTitle} // <-- onBlur 추가
          placeholderTextColor="#999"
          style={styles.textInput}
          returnKeyType="done"
        />
        {titleInputErrorText && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{titleInputErrorText}</Text>
          </View>
        )}

        {/* 내용 */}
        <TextInput
          value={contentInput}
          onChangeText={setContentInput}
          onBlur={validateContent} // <-- onBlur 추가
          placeholder="내용을 입력하세요"
          placeholderTextColor="#999"
          multiline={true}
          textAlignVertical="top"
          style={styles.multilineTextInput}
        />
        {contentInputErrorText && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{contentInputErrorText}</Text>
          </View>
        )}

        {/* 도착지 */}
        <TextInput
          value={destinationInput}
          placeholder="도착지 입력"
          onChangeText={setDestinationInput}
          onBlur={validateDestination} // <-- onBlur 추가
          placeholderTextColor="#999"
          style={styles.textInput}
          returnKeyType="done"
        />
        {destinationInputErrorText && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{destinationInputErrorText}</Text>
          </View>
        )}

        {/* 최대 모집 인원 */}
        <TextInput
          value={maxCapacityInput}
          onChangeText={setMaxCapacityInput}
          onBlur={validateMaxCapacity} // <-- onBlur 추가
          placeholder="최대 모집 인원 입력"
          placeholderTextColor="#999"
          keyboardType="numeric"
          style={styles.textInput}
          returnKeyType="done"
        />
        {maxCapacityInputErrorText && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{maxCapacityInputErrorText}</Text>
          </View>
        )}

        <CustomDateTimePicker
          testID="dateTimePicker"
          value={deadlineDts}
          mode="date"
          is24Hour={true}
          onChange={handleDeadlineDtsChange}
          datePickerButtonComponentStyle={styles.datePickerButton}
          datePickerTextComponentStyle={styles.datePickerText}
          showDatePicker={showDatePicker}
          setShowDatePicker={setShowDatePicker}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  dragHandleContainer: {
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragHandle: {
    width: 50,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 2.5,
  },
  scrollView: {
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
    textAlign: 'center',
  },
  postButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  postButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  textInput: {
    marginBottom: 10,
    padding: 10,
    color: 'black',
    fontSize: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 8,
  },
  multilineTextInput: {
    height: 150,
    padding: 10,
    color: 'black',
    fontSize: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 8,
    marginBottom: 10,
  },
  errorContainer: {
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
  },
  datePickerButton: {
    padding: 10,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 8,
    marginBottom: 10,
  },
  datePickerText: {
    fontSize: 16,
  },
});

export default NewPostSheet;
