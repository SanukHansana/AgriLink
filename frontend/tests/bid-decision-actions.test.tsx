import { afterEach, expect, jest, test } from '@jest/globals';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react-native';
import { BidDecisionActions } from '../src/components/farmer/bid-decision-actions';

afterEach(async () => { await cleanup(); });

test('reject is first on the left and acceptance requires explicit confirmation', async () => {
  const accept = jest.fn(), reject = jest.fn();
  await render(<BidDecisionActions busy={false} summary="Buyer · 50 kg · LKR 10,000" onAccept={accept} onReject={reject} />);
  expect(within(screen.getAllByRole('button')[0]).getByText('Reject')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Accept bid' }));
  expect(accept).not.toHaveBeenCalled();
  expect(screen.getByText('Buyer · 50 kg · LKR 10,000')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Confirm acceptance' }));
  expect(accept).toHaveBeenCalledTimes(1);
  expect(reject).not.toHaveBeenCalled();
});

test('a mistaken rejection can be cancelled without changing the bid', async () => {
  const reject = jest.fn();
  await render(<BidDecisionActions busy={false} summary="Buyer offer" onAccept={jest.fn()} onReject={reject} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Reject' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
  expect(reject).not.toHaveBeenCalled();
});
