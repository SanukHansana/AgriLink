import { afterEach, expect, jest, test } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { DateTimeField } from '../src/components/date-time-field';
import { SelectField } from '../src/components/select-field';

afterEach(async () => { await cleanup(); });

test('calendar supports leap days and emits the chosen date without a timezone shift', async () => {
  const change = jest.fn();
  await render(<DateTimeField label="Harvest date" value="2028-02-01" onChangeText={change} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Choose Harvest date' }));
  expect(screen.queryByRole('button', { name: 'Select 2028-02-30' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Select 2028-02-29' }));
  expect(change).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Use selected date' }));
  expect(change).toHaveBeenCalledWith('2028-02-29');
});

test('calendar can move across the year boundary and cancellation preserves the field', async () => {
  const change = jest.fn();
  await render(<DateTimeField label="Delivery date" value="2026-12-01" onChangeText={change} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Choose Delivery date' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Next month' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Select 2027-01-05' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Cancel date selection' }));
  expect(change).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Delivery date').props.value).toBe('2026-12-01');
});

test('manual date entry remains available', async () => {
  const change = jest.fn();
  await render(<DateTimeField label="Delivery date" value="" onChangeText={change} />);
  await fireEvent.changeText(screen.getByLabelText('Delivery date'), '2026-10-20');
  expect(change).toHaveBeenCalledWith('2026-10-20');
});

test('date and time menus save the selected local time as an ISO instant', async () => {
  const change = jest.fn();
  await render(<DateTimeField label="Visit time" mode="datetime" value="2026-10-20" onChangeText={change} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Choose Visit time' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Choose Hour (24-hour)' }));
  await fireEvent.press(screen.getByRole('button', { name: '21' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Choose Minute' }));
  await fireEvent.press(screen.getByRole('button', { name: '45' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Use selected date' }));
  expect(change).toHaveBeenCalledWith(new Date(2026, 9, 20, 21, 45).toISOString());
});

test('type menu shows labels and saves the allowed underlying value', async () => {
  const change = jest.fn();
  await render(<SelectField label="Notice Type" value="general" options={[{ label: 'General', value: 'general' }, { label: 'Training', value: 'training' }]} onChange={change} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Choose Notice Type' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Training' }));
  expect(change).toHaveBeenCalledWith('training');
});
