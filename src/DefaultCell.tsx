import {
  type StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import { Caret } from './Caret';
import { cellContent } from './core/cells';
import { metrics, type Palette } from './theme';
import type { Cell } from './types';

export interface DefaultCellProps {
  cell: Cell;
  palette: Palette;
  variant: 'box' | 'underline';
  disabled: boolean;
  caret: boolean;
  reduceMotion: boolean;
  caretStyle?: StyleProp<ViewStyle>;
  placeholder?: string;
  cellStyle?: StyleProp<ViewStyle>;
  focusedCellStyle?: StyleProp<ViewStyle>;
  filledCellStyle?: StyleProp<ViewStyle>;
  errorCellStyle?: StyleProp<ViewStyle>;
  successCellStyle?: StyleProp<ViewStyle>;
  disabledCellStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  placeholderStyle?: StyleProp<TextStyle>;
}

function borderColor(cell: Cell, palette: Palette): string {
  if (cell.status === 'error') return palette.error;
  if (cell.status === 'success') return palette.success;
  return cell.isActive ? palette.active : palette.border;
}

export function DefaultCell(props: DefaultCellProps) {
  const { cell, palette, variant, disabled, placeholder } = props;
  const borderWidth = cell.isActive ? metrics.activeBorderWidth : metrics.borderWidth;
  const look: ViewStyle =
    variant === 'box'
      ? {
          borderWidth,
          borderRadius: metrics.radius,
          backgroundColor: disabled ? palette.disabled : palette.cell,
        }
      : { borderBottomWidth: borderWidth };
  const content = cellContent(cell, props.caret, placeholder);

  return (
    <View
      style={[
        styles.cell,
        look,
        { borderColor: borderColor(cell, palette) },
        props.cellStyle,
        cell.isActive && props.focusedCellStyle,
        cell.isFilled && props.filledCellStyle,
        cell.status === 'error' && props.errorCellStyle,
        cell.status === 'success' && props.successCellStyle,
        disabled && props.disabledCellStyle,
      ]}
    >
      {content === 'char' ? (
        <Text style={[styles.text, { color: palette.text }, props.textStyle]}>{cell.char}</Text>
      ) : content === 'caret' ? (
        <Caret color={palette.caret} reduceMotion={props.reduceMotion} style={props.caretStyle} />
      ) : content === 'placeholder' ? (
        <Text
          style={[
            styles.text,
            { color: palette.placeholder },
            props.textStyle,
            props.placeholderStyle,
          ]}
        >
          {placeholder}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: metrics.fontSize, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
