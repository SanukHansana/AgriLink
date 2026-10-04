import { afterEach, expect, jest, test } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, TextInput } from '../src/i18n/native';
import { LanguagePicker } from '../src/components/language-picker';
import { restoreLanguage, setLanguage, translate } from '../src/i18n/language';
afterEach(async () => { await cleanup(); await setLanguage('en'); });
function Demo() { const [value, setValue] = useState('Rabu'); return <><LanguagePicker /><Text>Orders</Text><TextInput accessibilityLabel="Farm Name" value={value} onChangeText={setValue} placeholder="Address" /><Text localize={false}>Home</Text></>; }
test('switches controls immediately without changing typed product names and saves preference', async () => {
  await render(<Demo />);
  await fireEvent.press(screen.getByRole('button', { name: 'Language Preferences: EN' }));
  await fireEvent.press(screen.getByRole('button', { name: 'සිංහල' }));
  expect(screen.getByText('ඇණවුම්')).toBeTruthy();
  expect(screen.getByLabelText('ගොවිපළේ නම').props.value).toBe('Rabu');
  expect(screen.getByText('Home')).toBeTruthy();
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('agrilink-ui-language', 'si');
  await fireEvent.press(screen.getByRole('button', { name: 'භාෂා තේරීම: SI' }));
  await fireEvent.press(screen.getByRole('button', { name: 'தமிழ்' }));
  expect(screen.getByText('ஆர்டர்கள்')).toBeTruthy();
  expect(screen.getByLabelText('பண்ணையின் பெயர்').props.value).toBe('Rabu');
});
test('restores saved language and handles dynamic choices and outbid alerts', async () => {
  jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce('ta');
  await act(async () => { await restoreLanguage(); });
  expect(translate('Choose Delivery date')).toBe('தேர்ந்தெடு: விநியோக தேதி');
  expect(translate('Vegetables ▾')).toBe('காய்கறிகள் ▾');
  expect(translate('You have been outbid on Rabu. Another buyer offered LKR 200 per kg. Open My Bids to revise your offer.')).toContain('Rabu');
  expect(translate('Orders')).toBe('ஆர்டர்கள்');
});
test('unknown user text and order identifiers are preserved', () => {
  expect(translate('My special farm name', 'si')).toBe('My special farm name');
  expect(translate('Order ID: AG-123', 'ta')).toBe('ஆர்டர் எண்: AG-123');
});
