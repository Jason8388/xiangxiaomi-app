import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Platform,
  useColorScheme,
  ViewStyle,
  TextStyle,
  Modal,
  DatePickerIOS,
  TimePickerAndroid
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import dayjs from 'dayjs';
import { FontAwesome6 } from '@expo/vector-icons';

// --------------------------------------------------------
// 1. 配置 Dayjs 
// --------------------------------------------------------
// 即使服务端返回 '2023-10-20T10:00:00Z' (UTC)，
// dayjs(utcString).format() 会自动转为手机当前的本地时区显示。
// 如果需要传回给后端，我们再转回 ISO 格式。

interface SmartDateInputProps {
  label?: string;           // 表单标题 (可选)
  value?: string | null;    // 服务端返回的时间字符串 (ISO 8601, 带 T)
  onChange: (isoDate: string) => void; // 回调给父组件的值，依然是标准 ISO 字符串
  placeholder?: string;
  mode?: 'date' | 'time' | 'datetime'; // 支持日期、时间、或两者
  displayFormat?: string;   // UI展示的格式，默认 YYYY-MM-DD
  error?: string;           // 错误信息
  
  // 样式自定义（可选）
  containerStyle?: ViewStyle;        // 外层容器样式
  inputStyle?: ViewStyle;            // 输入框样式
  textStyle?: TextStyle;             // 文字样式
  labelStyle?: TextStyle;            // 标签样式
  placeholderTextStyle?: TextStyle;  // 占位符文字样式
  errorTextStyle?: TextStyle;        // 错误信息文字样式
  iconColor?: string;                // 图标颜色
  iconSize?: number;                 // 图标大小
}

export const SmartDateInput = ({ 
  label, 
  value, 
  onChange, 
  placeholder = '请选择',
  mode = 'date',
  displayFormat,
  error,
  containerStyle,
  inputStyle,
  textStyle,
  labelStyle,
  placeholderTextStyle,
  errorTextStyle,
  iconColor,
  iconSize = 18
}: SmartDateInputProps) => {
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // 默认展示格式
  const format = displayFormat || (mode === 'time' ? 'HH:mm' : 'YYYY-MM-DD');

  // --------------------------------------------------------
  // 2. 核心：数据转换逻辑 
  // --------------------------------------------------------
  
  // 解析服务端值，确保无效值不传给控件；time 模式兼容仅时间字符串
  const parsedValue = useMemo(() => {
    if (!value) return null;

    const direct = dayjs(value);
    if (direct.isValid()) return direct;

    if (mode === 'time') {
      const timeOnly = dayjs(`1970-01-01T${value}`);
      if (timeOnly.isValid()) return timeOnly;
    }

    return null;
  }, [value, mode]);

  // A. 将字符串转为 JS Date 对象给控件使用
  // 如果 value 是空或无效，回退到当前时间
  const dateObjectForPicker = useMemo(() => {
    return parsedValue ? parsedValue.toDate() : new Date();
  }, [parsedValue]);

  // B. 将 Date 对象转为展示字符串
  const displayString = useMemo(() => {
    if (!parsedValue) return '';
    return parsedValue.format(format);
  }, [parsedValue, format]);

  // --------------------------------------------------------
  // 3. 核心：交互逻辑 (解决键盘遮挡/无法收起)
  // --------------------------------------------------------

  const showDatePicker = () => {
    // 【关键点】打开日期控件前，必须强制收起键盘！
    // 否则键盘会遮挡 iOS 的底部滚轮，或者导致 Android 焦点混乱
    console.log('[SmartDateInput] showDatePicker 被调用');
    console.log('[SmartDateInput] isDatePickerVisible 当前值:', isDatePickerVisible);
    Keyboard.dismiss();
    setDatePickerVisibility(true);
    console.log('[SmartDateInput] isDatePickerVisible 设置为 true');
  };

  const hideDatePicker = () => {
    console.log('[SmartDateInput] hideDatePicker 被调用');
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date: Date) => {
    console.log('[SmartDateInput] handleConfirm 被调用, 日期:', date);
    hideDatePicker();
    // 采用带本地偏移的 ISO 字符串，避免 date 模式在非 UTC 时区出现跨天
    const serverString = dayjs(date).format(format);
    console.log('[SmartDateInput] 格式化后的日期:', serverString);
    onChange(serverString);
  };

  // 根据 mode 选择图标
  const iconName = mode === 'time' ? 'clock' : 'calendar';

  return (
    <View style={[styles.container, containerStyle]}>
      {/* 标题 */}
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}

      {Platform.OS === 'web' ? (
        <View style={styles.webInputWrapper}>
          <input
            type={mode === 'time' ? 'time' : 'date'}
            value={displayString}
            onChange={(e: any) => {
              const date = dayjs(e.target.value);
              if (date.isValid()) {
                onChange(date.format(format));
              }
            }}
            style={styles.webInput}
            placeholder={placeholder}
          />
        </View>
      ) : (
        <>
          <TouchableOpacity
            style={[
              styles.inputBox,
              error ? styles.inputBoxError : null,
              inputStyle
            ]}
            onPress={showDatePicker}
            activeOpacity={0.7}
            pointerEvents="auto"
            testID="date-input-button"
          >
            <Text
              style={[
                styles.text,
                textStyle,
                !value && styles.placeholder,
                !value && placeholderTextStyle
              ]}
              numberOfLines={1}
            >
              {displayString || placeholder}
            </Text>

            <FontAwesome6
              name={iconName}
              size={iconSize}
              color={iconColor || (value ? '#4B5563' : '#9CA3AF')}
              style={styles.icon}
            />
          </TouchableOpacity>

          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode={mode}
            date={dateObjectForPicker}
            onConfirm={handleConfirm}
            onCancel={hideDatePicker}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            isDarkModeEnabled={isDark}
            locale="zh-CN"
            confirmTextIOS="确定"
            cancelTextIOS="取消"
            testID="date-picker-modal"
          />
        </>
      )}

      {error && <Text style={[styles.errorText, errorTextStyle]}>{error}</Text>}
    </View>
  );
};

// 设计样式
const styles = StyleSheet.create({
  container: {},
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 2,
  },
  inputBox: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 1,
  },
  inputBoxError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  text: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  placeholder: {
    color: '#9CA3AF',
  },
  icon: {
    marginLeft: 12,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 2,
    fontSize: 12,
    color: '#EF4444',
  },
  webInputWrapper: {
    height: 52,
  },
  webInput: {
    width: '100%',
    height: '100%',
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    cursor: 'pointer',
  } as any,
});