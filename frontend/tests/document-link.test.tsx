import { afterEach, expect, jest, test } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { DocumentLink } from '../src/components/advisory/document-link';

afterEach(async () => { await cleanup(); });

test('opens a valid document using the device link handler', async () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  await render(<DocumentLink name="Soil report" url="https://example.com/report.pdf" />);
  await fireEvent.press(screen.getByRole('button', { name: 'Open Soil report' }));
  expect(open).toHaveBeenCalledWith('https://example.com/report.pdf');
  expect(screen.queryByText('This document link is not supported')).toBeNull();
});

test.each(['javascript:alert(1)', 'file:///tmp/report', 'data:text/html,test', 'https://user:password@example.com/report'])('blocks unsafe document URL %s', async (url) => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  await render(<DocumentLink name="Report" url={url} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Open Report' }));
  expect(await screen.findByText('This document link is not supported')).toBeTruthy();
  expect(open).not.toHaveBeenCalled();
});

test('shows a link-opening failure to the user', async () => {
  jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('No browser available'));
  await render(<DocumentLink name="Report" url="https://example.com/report" />);
  await fireEvent.press(screen.getByRole('button', { name: 'Open Report' }));
  expect(await screen.findByText('No browser available')).toBeTruthy();
});
