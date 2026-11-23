import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import dayjs from "dayjs";
import CustomDateTimePicker from "@/components/CustomDateTimePicker";
import theme from "@/modules/theme";

interface DeadlineFieldProps {
  /** null 이면 '마감 시까지'(날짜 없이 인원이 찰 때까지 모집) */
  value: Date | null;
  onChange: (value: Date | null) => void;
  pickerButtonStyle: object;
  pickerTextStyle: object;
  testID?: string;
}

/**
 * 모집 마감일 입력. 기본은 '마감 시까지'이고, '날짜 지정'을 고르면 달력이 나온다.
 */
const DeadlineField: React.FC<DeadlineFieldProps> = ({
  value,
  onChange,
  pickerButtonStyle,
  pickerTextStyle,
  testID,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const hasDate = value != null;

  const options = [
    { key: "open", label: "마감 시까지", selected: !hasDate, onPress: () => onChange(null) },
    {
      key: "date",
      label: "날짜 지정",
      selected: hasDate,
      onPress: () => {
        if (!hasDate) onChange(dayjs().add(1, "day").toDate());
      },
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>마감일</Text>
      <View style={styles.chipRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.chip, opt.selected && styles.chipSelected]}
            onPress={opt.onPress}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityState={{ selected: opt.selected }}
          >
            <Text style={[styles.chipText, opt.selected && styles.chipTextSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {hasDate ? (
        <CustomDateTimePicker
          testID={testID}
          value={value}
          mode="date"
          is24Hour={true}
          onChange={(_event: any, selected?: Date) => {
            if (selected) onChange(selected);
          }}
          datePickerButtonComponentStyle={pickerButtonStyle}
          datePickerTextComponentStyle={pickerTextStyle}
          showDatePicker={showDatePicker}
          setShowDatePicker={setShowDatePicker}
        />
      ) : (
        <Text style={styles.hint}>날짜 제한 없이 인원이 다 찰 때까지 모집해요.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.field,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  chipTextSelected: {
    color: theme.colors.white,
    fontWeight: "600",
  },
  hint: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
});

export default DeadlineField;
