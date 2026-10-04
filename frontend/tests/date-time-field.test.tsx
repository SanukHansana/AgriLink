import { afterEach, expect, jest, test } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { DateTimeField } from '../src/components/date-time-field';

afterEach(async () => { await cleanup(); jest.useRealTimers(); });

test('calendar blocks yesterday, allows today, and resets an existing past selection', async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 9, 13, 12));
  const change = jest.fn();
  await render(<DateTimeField label="Delivery date" value="2026-10-12" onChangeText={change} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Choose Delivery date' }));
  const yesterday = screen.getByRole('button', { name: 'Select 2026-10-12' });
  expect(yesterday.props.accessibilityState.disabled).toBe(true);
  await fireEvent.press(yesterday);
  await fireEvent.press(screen.getByRole('button', { name: 'Use selected date' }));
  expect(change).toHaveBeenCalledWith('2026-10-13');
});
