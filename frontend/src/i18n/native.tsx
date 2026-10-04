import { forwardRef, type ReactNode } from 'react';
import { Text as NativeText, TextInput as NativeInput, Button as NativeButton, Alert as NativeAlert, Pressable as NativePressable, View as NativeView, type PressableProps, type TextProps, type TextInputProps, type ButtonProps } from 'react-native';
import { translate, useLanguage } from './language';
export type Text = NativeText;
export type TextInput = NativeInput;
function content(children: ReactNode): ReactNode {
  if (typeof children === 'string') return translate(children);
  if (Array.isArray(children)) return children.map(content);
  return children;
}
// The type aliases preserve React Native refs while these values render localized controls.
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const Text = forwardRef<NativeText, TextProps & { localize?: boolean }>(function LocalizedText({ localize = true, ...props }, ref) {
  useLanguage();
  return <NativeText {...props} ref={ref} accessibilityLabel={props.accessibilityLabel && translate(props.accessibilityLabel)}>{localize ? content(props.children) : props.children}</NativeText>;
});
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const TextInput = forwardRef<NativeInput, TextInputProps>(function LocalizedTextInput(props, ref) {
  useLanguage();
  return <NativeInput {...props} ref={ref} placeholder={props.placeholder && translate(props.placeholder)} accessibilityLabel={props.accessibilityLabel && translate(props.accessibilityLabel)} />;
});
export function Button(props: ButtonProps) {
  useLanguage();
  return <NativeButton {...props} title={translate(props.title)} accessibilityLabel={props.accessibilityLabel && translate(props.accessibilityLabel)} />;
}
export const Pressable = forwardRef<NativeView, PressableProps>(function LocalizedPressable(props, ref) {
  useLanguage();
  return <NativePressable {...props} ref={ref} accessibilityLabel={props.accessibilityLabel && translate(props.accessibilityLabel)} accessibilityHint={props.accessibilityHint && translate(props.accessibilityHint)} />;
});
export const Alert: typeof NativeAlert = {
  ...NativeAlert,
  alert: (title, message, buttons, options) => NativeAlert.alert(translate(title), message && translate(message), buttons?.map((button) => ({ ...button, text: button.text && translate(button.text) })), options),
};
