import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { FittingRoomProvider, useFittingRoom } from './FittingRoomContext';

const profile = { id: 'first', name: 'Synthetic first', height: 165, weight: 55, chest: 85, waist: 68, hips: 92, shoulder: 38, arm: 26, thigh: 50, belly: 70, legLength: 95 };
function Consumer() {
  const { currentAvatar, currentAvatarId, removeAvatar } = useFittingRoom();
  return <><output aria-label="active identity">{currentAvatarId || 'guest'}</output>
    <output aria-label="active name">{currentAvatar.name}</output>
    <button onClick={() => removeAvatar(currentAvatar.id)}>Remove active</button></>;
}
beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); localStorage.clear(); });
it('recovers a stale stored identity and persists the actual available avatar', () => {
  localStorage.setItem('vfit_avatars', JSON.stringify([profile]));
  localStorage.setItem('vfit_current_avatar_id', 'deleted-avatar');
  render(<FittingRoomProvider><Consumer /></FittingRoomProvider>);
  expect(screen.getByLabelText('active identity')).toHaveTextContent('first');
  expect(localStorage.getItem('vfit_current_avatar_id')).toBe('first');
});
it('removing active avatars falls back to the next identity and finally the guest', () => {
  localStorage.setItem('vfit_avatars', JSON.stringify([profile, { ...profile, id: 'second', name: 'Synthetic second' }]));
  localStorage.setItem('vfit_current_avatar_id', 'first');
  render(<FittingRoomProvider><Consumer /></FittingRoomProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Remove active' }));
  expect(screen.getByLabelText('active identity')).toHaveTextContent('second');
  fireEvent.click(screen.getByRole('button', { name: 'Remove active' }));
  expect(screen.getByLabelText('active identity')).toHaveTextContent('guest');
  expect(localStorage.getItem('vfit_current_avatar_id')).toBeNull();
});
