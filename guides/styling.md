# Style the cells

`OTPField` draws box cells by default and takes its colors from the system color scheme, light or dark. The [props table](https://github.com/SectionTN/react-native-otpkit#props) lists every style prop.

## Pick a look

Pass `variant` for the underline look:

```tsx
<OTPField variant="underline" />
```

`groups` splits the cells into groups with a dash between them. The counts must add up to `length`:

```tsx
<OTPField groups={[3, 3]} />
```

`renderSeparator` replaces the dash. It gets the index of the cell before it:

```tsx
<OTPField groups={[3, 3]} renderSeparator={() => <Text>-</Text>} />
```

`placeholder` shows one character in each empty cell, and `secure` draws a dot in each filled one:

```tsx
<OTPField placeholder="•" />
<OTPField secure />
```

## Change colors and sizes

`cellStyle` and `textStyle` take a style for every cell. Cells are 52 wide and 56 tall, and a `width` or `height` in `cellStyle` resizes them:

```tsx
<OTPField length={4} cellStyle={{ width: 64, height: 64 }} />
```

Pass a function instead to style each cell from its state. This one colors the focused cell and the cells of a wrong code:

```tsx
<OTPField
  cellStyle={({ isActive, status }) => [
    isActive && { borderColor: '#FF6F61' },
    status === 'error' && { backgroundColor: '#FEF2F2' },
  ]}
/>
```

The function gets a `Cell`:

| Field | Type | Description |
| --- | --- | --- |
| `index` | `number` | The position of the cell, from 0. |
| `char` | `string` | The character to draw, a dot when `secure` is on, or `''`. |
| `isFilled` | `boolean` | Whether the cell contains a character. |
| `isActive` | `boolean` | Whether the next typed character goes into this cell. It's only `true` while the field has focus. |
| `isDisabled` | `boolean` | Whether the field's `disabled` prop is on. |
| `status` | `'idle' \| 'verifying' \| 'error' \| 'success'` | The status of the field. |

`caretStyle` styles the blinking caret, and `caret={false}` hides it.

## Draw your own cells

`renderCell` replaces what each cell draws. The field still keeps the hidden input, focus and the status, so autofill, paste and SMS keep working:

```tsx
<OTPField
  renderCell={(cell) => (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: cell.isActive || cell.isFilled ? '#2563EB' : '#D4D4D4',
        backgroundColor: cell.isFilled ? '#2563EB' : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '600' }}>{cell.char}</Text>
    </View>
  )}
/>
```

`variant`, `cellStyle`, `textStyle` and `caretStyle` don't apply to cells from `renderCell`.

## Build the whole field yourself

`useOTPField` holds the field logic and leaves the drawing to you. Spread `inputProps` on a `TextInput` laid over your cells:

```tsx
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useOTPField } from 'react-native-otpkit';

export function CodeField() {
  const field = useOTPField({ length: 4, onComplete: (code) => console.log(code) });

  return (
    <View style={{ height: 80 }}>
      <View style={{ flexDirection: 'row', gap: 16, pointerEvents: 'none' }}>
        {field.cells.map((cell) => (
          <View
            key={cell.index}
            style={{ width: 56, height: 80, borderBottomWidth: 3, borderColor: cell.isActive ? '#2563EB' : '#D4D4D4' }}
          >
            <Text style={{ fontSize: 44, textAlign: 'center' }}>{cell.char}</Text>
          </View>
        ))}
      </View>
      <TextInput
        {...field.inputProps}
        accessibilityLabel="Verification code"
        style={[StyleSheet.absoluteFill, { opacity: 0.011, color: 'transparent' }]}
      />
    </View>
  );
}
```

Keep the input at an opacity of `0.011`. iOS ignores touches on views below `0.01`.
