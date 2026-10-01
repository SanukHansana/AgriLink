import { afterEach, expect, jest, test } from '@jest/globals';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { AdvisoryState } from '../src/components/advisory/advisory-state';

afterEach(async () => { await cleanup(); });

test('shows loading while data is being fetched', async () => {
  await render(<AdvisoryState isLoading error="Old error" />);
  expect(screen.getByText('Loading advisory information...')).toBeTruthy();
  expect(screen.queryByText('Old error')).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
});

test('shows an empty message without a retry action', async () => {
  await render(<AdvisoryState emptyMessage="No requests in your district" />);
  expect(screen.getByText('No requests in your district')).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
});

test('shows the error and allows the user to retry', async () => {
  const retry = jest.fn();
  await render(<AdvisoryState error="Connection unavailable" onRetry={retry} />);
  expect(screen.getByText('Connection unavailable')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  expect(retry).toHaveBeenCalledTimes(1);
});
