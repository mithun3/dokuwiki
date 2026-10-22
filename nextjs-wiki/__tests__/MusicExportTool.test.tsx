import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MusicExportTool from '@/components/tools/MusicExportTool';

const PLAYLIST_PATH = 'G:\\Music\\Artist\\track.mp3';
const REMAPPED_PATH = 'D:\\Music\\Artist\\track.mp3';

async function loadPlaylist(container: HTMLElement): Promise<void> {
  const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!fileInput) throw new Error('Playlist file input was not rendered');

  const playlist = new File([`#EXTM3U\n${PLAYLIST_PATH}\n`], 'Windows Mix.m3u8', {
    type: 'audio/x-mpegurl',
  });
  fireEvent.change(fileInput, { target: { files: [playlist] } });

  await screen.findByText('1 track detected');
}

describe('MusicExportTool source drive override', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows a session-only Windows control and updates path previews', async () => {
    const { container, unmount } = render(<MusicExportTool isLocalhost={false} />);

    expect(screen.queryByLabelText('Current Source Music Drive Letter')).toBeNull();
    await loadPlaylist(container);
    fireEvent.click(screen.getByRole('button', { name: 'Windows (.bat)' }));

    const sourceDrive = screen.getByLabelText('Current Source Music Drive Letter') as HTMLInputElement;
    expect(sourceDrive.maxLength).toBe(1);
    expect(sourceDrive.pattern).toBe('[A-Za-z]');
    expect(sourceDrive.placeholder).toBe('');
    expect(screen.getByText(/Do not enter the destination drive/)).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('No override applied. Script would use G:');
    expect((screen.getByRole('button', { name: 'Download .bat Script' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(sourceDrive, { target: { value: 'd' } });
    expect(sourceDrive.value).toBe('D');
    expect(screen.getByRole('status').textContent).toBe('Override active: G: → D:');
    expect((screen.getByRole('button', { name: 'Download .bat Script' }) as HTMLButtonElement).disabled).toBe(false);

    fireEvent.change(sourceDrive, { target: { value: '1' } });
    expect(sourceDrive.value).toBe('D');

    expect(screen.getAllByText(REMAPPED_PATH).length).toBeGreaterThan(0);
    expect(localStorage.getItem('music-export-source-drive')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Mac / Linux (.sh)' }));
    expect(screen.queryByLabelText('Current Source Music Drive Letter')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Windows (.bat)' }));
    expect((screen.getByLabelText('Current Source Music Drive Letter') as HTMLInputElement).value).toBe('D');

    unmount();
    render(<MusicExportTool isLocalhost={false} />);
    expect((screen.getByLabelText('Current Source Music Drive Letter') as HTMLInputElement).value).toBe('');
  });

  it('submits effective source paths to the localhost copy API', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Test response' }),
    } as Response);
    const { container } = render(<MusicExportTool isLocalhost />);

    fireEvent.change(screen.getByLabelText('Destination Root Path'), {
      target: { value: 'D:\\Exports' },
    });
    await loadPlaylist(container);
    fireEvent.click(screen.getByRole('button', { name: 'Windows (.bat)' }));
    fireEvent.change(screen.getByLabelText('Current Source Music Drive Letter'), { target: { value: 'D' } });

    fireEvent.click(screen.getByRole('button', { name: /Copy Files via Server/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const request = fetchMock.mock.calls[0][1];
    expect(JSON.parse(request?.body as string)).toEqual({
      tracks: [{ sourcePath: REMAPPED_PATH, playlistName: 'Windows Mix' }],
      destinationDirectory: 'D:\\Exports',
    });
  });
});