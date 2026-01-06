import React, { useState } from 'react';
import { Platform, TouchableOpacity, Text, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';

interface CommonCustomDateTimePickerProps {
  testID?: string;
  value: Date;
  mode: 'date' | 'time' | 'datetime';
  is24Hour?: boolean;
  onChange: (event: any, selectedDate?: Date) => void;
  datePickerButtonComponentStyle: object;
  datePickerTextComponentStyle: object;
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
}


const CustomDateTimePicker: React.FC<CommonCustomDateTimePickerProps> = (props) => {
  const { value, mode, is24Hour, onChange, datePickerButtonComponentStyle, datePickerTextComponentStyle } = props;
  const [showPicker, setShowPicker] = useState(false);

  const handleNativeChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    onChange(event, selectedDate);
  };
  console.log('native>>>');

  if (Platform.OS === 'web') {
    console.warn("CustomDateTimePicker (Native version) is being rendered on Web. This shouldn't happen.");
    return null;
  }

  return (
    <>
      <TouchableOpacity onPress={() => setShowPicker(true)} style={datePickerButtonComponentStyle}>
        <Text style={datePickerTextComponentStyle}>
          {value ? dayjs(value).format('YYYY-MM-DD (ddd)') : '마감일 선택'}
        </Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={value}
          mode={mode}
          is24Hour={is24Hour}
          onChange={handleNativeChange}
          display="default"
        />
      )}
    </>
  );
};

export default CustomDateTimePicker;