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
import theme from '@/modules/theme';

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

  // 카테고리 칩 목록. 서버에서 불러온 카테고리 + '직접입력'
  categoryOptions: string[];
  categoryPreset: string;
  setCategoryPreset: (value: string) => void;
  customCategoryInput: string;
  setCustomCategoryInput: (text: string) => void;
  isCustomCategory: boolean;
  categoryInputErrorText: string | null;

  deadlineDts: Date;
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
  handleDeadlineDtsChange: (event: any, selectedDate?: Date) => void;
}

const DESTINATION_QUICK_PICKS = ['강촌', '강변', '회사'];

const NewPostSheet: React.FC<NewPostSheetProps> = React.memo((props) => {
  const {
    screenHeight, pan, panResponder, onPressCancel, onPressPost,
    titleInput, setTitleInput, titleInputErrorText, validateTitle,
    contentInput, setContentInput, contentInputErrorText, validateContent,
    destinationInput, setDestinationInput, destinationInputErrorText, validateDestination,
    maxCapacityInput, setMaxCapacityInput, maxCapacityInputErrorText, validateMaxCapacity,
    categoryOptions, categoryPreset, setCategoryPreset, customCategoryInput, setCustomCategoryInput,
    isCustomCategory, categoryInputErrorText,
    deadlineDts, handleDeadlineDtsChange, showDatePicker, setShowDatePicker
  } = props;


  // TextInput 오류 여부에 따라 Post 버튼의 배경색 결정 (props로 받은 에러 텍스트 사용)
  const isPostButtonDisabled =
    titleInputErrorText || contentInputErrorText || destinationInputErrorText ||
    maxCapacityInputErrorText || categoryInputErrorText;

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
                ? theme.colors.textDisabled
                : theme.colors.primary,
            }}
            onPress={onPressPost}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={!!isPostButtonDisabled} // disabled prop 추가
          >
            <Text style={styles.postButtonText}>등록</Text>
          </TouchableOpacity>
        </View>

        {/* 카테고리 */}
        <Text style={styles.fieldLabel}>카테고리</Text>
        <View style={styles.quickPickRow}>
          {categoryOptions.map((option) => {
            const selected = categoryPreset === option;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.quickPickChip, selected && styles.quickPickChipSelected]}
                onPress={() => setCategoryPreset(option)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={[styles.quickPickChipText, selected && styles.quickPickChipTextSelected]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {isCustomCategory && (
          <TextInput
            value={customCategoryInput}
            placeholder="카테고리 직접 입력"
            onChangeText={setCustomCategoryInput}
            placeholderTextColor={theme.colors.textMuted}
            style={styles.textInput}
            returnKeyType="done"
          />
        )}
        {!!categoryInputErrorText && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{categoryInputErrorText}</Text>
          </View>
        )}

        {/* 제목 */}
        <TextInput
          value={titleInput}
          placeholder="제목"
          onChangeText={setTitleInput}
          onBlur={validateTitle} // <-- onBlur 추가
          placeholderTextColor={theme.colors.textMuted}
          style={styles.textInput}
          returnKeyType="done"
        />
        {!!titleInputErrorText && (
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
          placeholderTextColor={theme.colors.textMuted}
          multiline={true}
          textAlignVertical="top"
          style={styles.multilineTextInput}
        />
        {!!contentInputErrorText && (
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
          placeholderTextColor={theme.colors.textMuted}
          style={styles.textInput}
          returnKeyType="done"
        />
        {/* 도착지 빠른 실행: 누르면 즉시 입력란에 반영 */}
        <View style={styles.quickPickRow}>
          {DESTINATION_QUICK_PICKS.map((place) => {
            const selected = destinationInput === place;
            return (
              <TouchableOpacity
                key={place}
                style={[styles.quickPickChip, selected && styles.quickPickChipSelected]}
                onPress={() => setDestinationInput(place)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={[styles.quickPickChipText, selected && styles.quickPickChipTextSelected]}>
                  {place}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {!!destinationInputErrorText && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{destinationInputErrorText}</Text>
          </View>
        )}

        {/* 최대 모집 인원 */}
        <TextInput
          value={maxCapacityInput}
          onChangeText={setMaxCapacityInput}
          onBlur={validateMaxCapacity} // <-- onBlur 추가
          placeholder="최대 모집 인원(본인 포함)"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="numeric"
          style={styles.textInput}
          returnKeyType="done"
        />
        {!!maxCapacityInputErrorText && (
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
    width: 44,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.pill,
  },
  scrollView: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  postButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: theme.radius.pill,
  },
  postButtonText: {
    color: theme.colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  textInput: {
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: theme.colors.text,
    fontSize: 16,
    backgroundColor: theme.colors.field,
    borderRadius: theme.radius.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  quickPickRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: -4,
    marginBottom: 12,
  },
  quickPickChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.field,
  },
  quickPickChipSelected: {
    backgroundColor: theme.colors.primary,
  },
  quickPickChipText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  quickPickChipTextSelected: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  multilineTextInput: {
    height: 150,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: theme.colors.text,
    fontSize: 16,
    backgroundColor: theme.colors.field,
    borderRadius: theme.radius.md,
    marginBottom: 12,
  },
  errorContainer: {
    marginBottom: 12,
    marginTop: -6,
    paddingHorizontal: 4,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
  },
  datePickerButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.field,
    borderRadius: theme.radius.md,
    marginBottom: 12,
  },
  datePickerText: {
    fontSize: 16,
    color: theme.colors.text,
  },
});

export default NewPostSheet;
