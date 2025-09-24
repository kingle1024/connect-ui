import React, {
  useImperativeHandle,
  forwardRef,
  useState,
  useEffect,
} from "react";
import {
  StyleSheet,
  View,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
} from "react-native";

export interface CustomBottomSheetProps {
  minClosingHeight?: number;
  children?: React.ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
  onHeightChange?: (height: number) => void;
  extraContentHeight?: number;
}

export interface CustomBottomSheetRef {
  open: () => void;
  close: () => void;
  bottomSheetHeight: number;
}

const CustomBottomSheet = forwardRef<
  CustomBottomSheetRef,
  CustomBottomSheetProps
>(
  (
    {
      minClosingHeight = 0,
      children,
      onOpen,
      onClose,
      onHeightChange,
      extraContentHeight,
    },
    ref
  ) => {
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [_, setIsOpen] = useState(false);

    // 전체 높이 계산 및 부모 컴포넌트에 전달
    const totalHeight = minClosingHeight + (extraContentHeight ?? 0);

    useEffect(() => {
      onHeightChange?.(totalHeight);
    }, [totalHeight, onHeightChange]);

    // 키보드 이벤트 처리
    useEffect(() => {
      const keyboardDidShowListener = Keyboard.addListener(
        Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
        (e) => {
          setKeyboardHeight(e.endCoordinates.height);
        }
      );

      const keyboardDidHideListener = Keyboard.addListener(
        Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
        () => {
          setKeyboardHeight(0);
        }
      );

      if (keyboardHeight === 0) {
        close();
      } else {
        open();
      }

      return () => {
        keyboardDidShowListener.remove();
        keyboardDidHideListener.remove();
      };
    }, [totalHeight, keyboardHeight]);

    const open = () => {
      setIsOpen(true);
      onOpen?.();
    };

    const close = () => {
      Keyboard.dismiss();
      setIsOpen(false);
      onClose?.();
    };

    useImperativeHandle(ref, () => ({
      open,
      close,
      bottomSheetHeight: keyboardHeight + (extraContentHeight ?? 0),
    }));

    return (
      <>
        {/* BottomSheet */}
        <KeyboardAvoidingView
          style={[
            styles.container,
            {
              height: totalHeight,
              bottom: Math.max(0, keyboardHeight - 20),
            },
          ]}
        >
          <View style={styles.content}>{children}</View>
        </KeyboardAvoidingView>
      </>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flex: 1,
  },
});

export default CustomBottomSheet;
