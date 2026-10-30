import { Fragment, useEffect, useImperativeHandle } from 'react';
import {
  Animated,
  Platform,
  type StyleProp,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
  type ViewStyle,
} from 'react-native';
import { resolveLength } from './core/cells';
import { separatorsAfter } from './core/groups';
import { DefaultCell } from './DefaultCell';
import { useSmsCode } from './sms/useSmsCode';
import { HIDDEN_INPUT_OPACITY, metrics, palettes } from './theme';
import type { OTPFieldProps } from './types';
import { useOTPField } from './useOTPField';
import { usePropWarnings } from './usePropWarnings';
import { useReduceMotion } from './useReduceMotion';
import { useShake } from './useShake';
import { useStatusAnnouncement } from './useStatusAnnouncement';

const SIZE_KEYS = ['width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight'] as const;

// The size props of cellStyle size the slot that a built-in cell fills.
function slotSize(cellStyle: StyleProp<ViewStyle>): ViewStyle {
  const flat = StyleSheet.flatten(cellStyle) ?? {};
  return Object.fromEntries(
    SIZE_KEYS.filter((key) => flat[key] !== undefined).map((key) => [key, flat[key]]),
  );
}

export function OTPField(props: OTPFieldProps) {
  const {
    length: lengthProp,
    type,
    value,
    defaultValue,
    onChange,
    onComplete,
    status,
    clearOnError,
    blurOnComplete,
    transform,
    secure,
    disabled,
    onFocus,
    onBlur,
    placeholder,
    groups,
    sms: smsMode,
    smsSender,
    caret = true,
    caretStyle,
    statusMessages,
    autoFocus = true,
    variant = 'box',
    cellStyle,
    focusedCellStyle,
    filledCellStyle,
    errorCellStyle,
    successCellStyle,
    disabledCellStyle,
    textStyle,
    placeholderStyle,
    renderCell,
    renderSeparator,
    textInputProps,
    ref,
    testID,
    accessibilityLabel,
    style,
    ...viewProps
  } = props;

  usePropWarnings({ length: lengthProp, type, groups, value, defaultValue });
  const length = resolveLength(lengthProp);
  const field = useOTPField({
    length: lengthProp,
    type,
    value,
    defaultValue,
    onChange,
    onComplete,
    status,
    clearOnError,
    blurOnComplete,
    transform,
    secure,
    disabled,
    onFocus,
    onBlur,
  });
  const palette = palettes[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const separators = separatorsAfter(groups, length);
  const reduceMotion = useReduceMotion();
  const shake = useShake(field.status, reduceMotion);
  const message = useStatusAnnouncement(field.status, statusMessages);
  const verifying = field.status === 'verifying';
  const { focus, blur, clear, setValue } = field;
  const listening = Boolean(smsMode) && !disabled;
  const sms = useSmsCode({
    mode: smsMode || 'consent',
    enabled: listening,
    length,
    type,
    sender: smsSender,
  });
  const listenAgain = sms.start;

  // A received message goes through the paste rules, then onComplete.
  useEffect(() => {
    if (sms.message != null) setValue(sms.message);
  }, [sms.message, setValue]);

  useImperativeHandle(
    ref,
    () => ({
      focus,
      blur,
      clear,
      setValue,
      listenForSms: () => {
        if (listening) listenAgain();
      },
    }),
    [focus, blur, clear, setValue, listening, listenAgain],
  );

  // Android often refuses to open the keyboard during a screen transition, so it waits.
  useEffect(() => {
    if (!autoFocus) return;
    if (Platform.OS === 'android') {
      const timer = setTimeout(focus, 300);
      return () => clearTimeout(timer);
    }
    const frame = requestAnimationFrame(focus);
    return () => cancelAnimationFrame(frame);
  }, [autoFocus, focus]);

  const spoken = secure
    ? `${field.value.length} of ${length} entered`
    : field.value.split('').join(' ');
  const slot = renderCell ? undefined : [styles.slot, slotSize(cellStyle)];

  return (
    <View {...viewProps} testID={testID} style={[styles.root, style]}>
      <Animated.View
        style={[styles.row, { opacity: verifying ? 0.5 : 1, transform: [{ translateX: shake }] }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {field.cells.map((cell) => (
          <Fragment key={cell.index}>
            <View testID={testID ? `${testID}-cell-${cell.index}` : undefined} style={slot}>
              {renderCell ? (
                renderCell(cell)
              ) : (
                <DefaultCell
                  cell={cell}
                  palette={palette}
                  variant={variant}
                  disabled={disabled ?? false}
                  caret={caret && !verifying}
                  caretStyle={caretStyle}
                  reduceMotion={reduceMotion}
                  placeholder={placeholder}
                  cellStyle={cellStyle}
                  focusedCellStyle={focusedCellStyle}
                  filledCellStyle={filledCellStyle}
                  errorCellStyle={errorCellStyle}
                  successCellStyle={successCellStyle}
                  disabledCellStyle={disabledCellStyle}
                  textStyle={textStyle}
                  placeholderStyle={placeholderStyle}
                />
              )}
            </View>
            {separators.has(cell.index) &&
              (renderSeparator ? (
                renderSeparator(cell.index)
              ) : (
                <View style={[styles.dash, { backgroundColor: palette.border }]} />
              ))}
          </Fragment>
        ))}
      </Animated.View>
      <TextInput
        {...field.inputProps}
        {...textInputProps}
        ref={field.inputProps.ref}
        onFocus={(event) => {
          field.inputProps.onFocus();
          textInputProps?.onFocus?.(event);
        }}
        onBlur={(event) => {
          field.inputProps.onBlur();
          textInputProps?.onBlur?.(event);
        }}
        testID={testID ? `${testID}-input` : undefined}
        accessibilityLabel={accessibilityLabel ?? 'Verification code'}
        accessibilityValue={{ text: spoken }}
        style={[StyleSheet.absoluteFill, styles.input, textInputProps?.style]}
      />
      {Platform.OS !== 'ios' && (
        <Text accessibilityLiveRegion="polite" style={styles.live}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: 'stretch' },
  row: {
    flexDirection: 'row',
    direction: 'ltr',
    justifyContent: 'center',
    alignItems: 'center',
    gap: metrics.gap,
    pointerEvents: 'none',
  },
  slot: { flexShrink: 1, width: metrics.width, height: metrics.height },
  dash: { width: metrics.dashWidth, height: metrics.dashHeight },
  input: {
    opacity: HIDDEN_INPUT_OPACITY,
    color: 'transparent',
    ...Platform.select({ web: { outlineWidth: 0 } }),
  },
  // Visible to the accessibility tree, invisible on screen; an alpha of 0 would hide it from both.
  live: { position: 'absolute', width: 1, height: 1, overflow: 'hidden', color: 'transparent' },
});
