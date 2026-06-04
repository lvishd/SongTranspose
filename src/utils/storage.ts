import AsyncStorage from '@react-native-async-storage/async-storage';
import type {Song} from '../types';

const STORAGE_KEY = 'songs_v1';

const SEED_SONG: Song = {
  id: 'seed_1',
  title: 'Example Song',
  lines: [
    {
      lyrics: 'Those are some words here',
      chords: [
        {name: 'Am', charIndex: 0},
        {name: 'Gm', charIndex: 13},
      ],
    },
    {
      lyrics: '',
      chords: [],
    },
    {
      lyrics: 'Those are some other words',
      chords: [
        {name: 'Dm', charIndex: 13},
        {name: 'C', charIndex: 32},
      ],
    },
    {
      lyrics: '',
      chords: [],
    },
    {
      lyrics: 'A final line with more chords',
      chords: [
        {name: 'F', charIndex: 0},
        {name: 'G', charIndex: 9},
        {name: 'Am', charIndex: 19},
      ],
    },
  ],
};

export async function loadSongs(): Promise<Song[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as Song[];
  } catch {
    return [];
  }
}

export async function saveSongs(songs: Song[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
}

export async function addSong(song: Song): Promise<void> {
  const songs = await loadSongs();
  songs.push(song);
  await saveSongs(songs);
}

export async function updateSong(song: Song): Promise<void> {
  const songs = await loadSongs();
  const index = songs.findIndex(s => s.id === song.id);
  if (index !== -1) {
    songs[index] = song;
    await saveSongs(songs);
  }
}

export async function deleteSong(id: string): Promise<void> {
  const songs = await loadSongs();
  const filtered = songs.filter(s => s.id !== id);
  await saveSongs(filtered);
}

export async function seedIfEmpty(): Promise<void> {
  const songs = await loadSongs();
  if (songs.length === 0) {
    await saveSongs([SEED_SONG]);
  }
}
