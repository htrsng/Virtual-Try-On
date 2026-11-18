import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AIOutfitGenerator from './AIOutfitGenerator';
import { FittingRoomProvider } from '../contexts/FittingRoomContext';
import { generateOutfit } from '../services/aiOutfitService';
import type { ChatMessage } from '../types/outfit';

const state = vi.hoisted(() => ({ outfits: [], generate: vi.fn(), setOutfits: vi.fn(), setError: vi.fn() }));
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: { _id: 'synthetic' } }) }));
vi.mock('../hooks/useOutfitGenerator', () => ({ useOutfitGenerator: () => ({ outfits: state.outfits, isLoading: false, error: '', fallbackMode: false, shopLoading: false, handleGenerateOutfit: vi.fn(), setOutfits: state.setOutfits, setError: state.setError }) }));
vi.mock('../services/aiOutfitService', () => ({ generateOutfit: state.generate }));
vi.mock('../components/ai-outfit/LeftPanel', () => ({ default: () => null }));
vi.mock('../components/outfit/AvatarPanel', () => ({ default: () => null }));
vi.mock('../features/virtual-tryon/components/BodyEditorDrawer', () => ({ default: () => null }));
vi.mock('../components/outfit/TryOnPanel', () => ({ default: () => null }));
vi.mock('../components/outfit/AIOutfitSuggestionsPanel', () => ({ default: ({ isGenerating, onSendMessage, messages }: { isGenerating: boolean; onSendMessage: (message: string) => Promise<void>; messages: ChatMessage[] }) => <>
  <button onClick={() => { void onSendMessage('Synthetic refinement'); }}>Refine</button>
  <output aria-label="busy">{String(isGenerating)}</output>
  <output aria-label="messages">{messages.map(message => message.content).join('|')}</output>
</> }));

beforeEach(() => {
  localStorage.clear(); state.generate.mockReset();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ items: [] }) }));
});
afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); });
const show = () => render(<MemoryRouter><FittingRoomProvider><AIOutfitGenerator /></FittingRoomProvider></MemoryRouter>);

it('refinement exposes pending state then clears it when the service completes', async () => {
  let complete!: (value: Awaited<ReturnType<typeof generateOutfit>>) => void;
  state.generate.mockReturnValue(new Promise(resolve => { complete = resolve; }));
  show(); fireEvent.click(screen.getByRole('button', { name: 'Refine' }));
  expect(screen.getByLabelText('busy')).toHaveTextContent('true');
  await act(async () => { complete({ outfits: [], message: 'Synthetic complete', suggestions: [] }); });
  expect(screen.getByLabelText('busy')).toHaveTextContent('false');
  expect(screen.getByLabelText('messages')).toHaveTextContent('Synthetic complete');
});
it('refinement renders a service error and releases pending state', async () => {
  state.generate.mockRejectedValue(new Error('Synthetic provider unavailable'));
  show();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Refine' })); });
  expect(screen.getByLabelText('busy')).toHaveTextContent('false');
  expect(screen.getByLabelText('messages')).toHaveTextContent('Synthetic provider unavailable');
});
