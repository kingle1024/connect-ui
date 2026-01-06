import React from 'react';
import { Platform, View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import dayjs from 'dayjs';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

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

const WebCustomDateInput = React.forwardRef(({ value, onClick, style, textStyle }:
  {
    value: string,
    onClick?: () => void,
    style: object,
    textStyle: object
  },
  ref: React.Ref<HTMLDivElement>
) => (
  <TouchableOpacity onPress={onClick} style={style} ref={ref as any}>
    <Text style={textStyle}>
      {value || '마감일 선택'}
    </Text>
  </TouchableOpacity>
));

const CustomDateTimePicker: React.FC<CommonCustomDateTimePickerProps> = (props) => {
  const {
    value, mode, onChange,
    datePickerButtonComponentStyle, datePickerTextComponentStyle,
    showDatePicker, setShowDatePicker
  } = props;

  const handleWebChange = (date: Date | null) => {
    onChange({}, date || undefined); 
    setShowDatePicker(false);
  };

  if (Platform.OS !== 'web') {
    console.warn("CustomDateTimePicker (Web) should not be loaded on native.");
    return null;
  }

  if (mode === 'date') {
    return (
      <View style={styles.webContainer}>
        <DatePicker

          selected={value}
          onChange={handleWebChange}
          dateFormat="yyyy-MM-dd (eee)"
          showYearDropdown
          showMonthDropdown
          dropdownMode="select"
          popperPlacement="bottom-start"

          onClickOutside={() => setShowDatePicker(false)}

          customInput={
            <WebCustomDateInput 
              value={value ? dayjs(value).format('YYYY-MM-DD (ddd)') : ''} 
              style={datePickerButtonComponentStyle} 
              textStyle={datePickerTextComponentStyle}
            />
          }
        />
      </View>
    );
  } else {
    return (
      <View style={styles.webContainer}>
        <Text>웹용 {mode} 선택기는 아직 구현되지 않았습니다.</Text>
        <input type="text" value={dayjs(value).format('YYYY-MM-DD HH:mm')} readOnly style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 5 }} />
      </View>
    );
  }
};

const styles = StyleSheet.create({
  webContainer: {
    alignItems: 'flex-start',
  },
});

export default CustomDateTimePicker;