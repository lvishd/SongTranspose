import type {Song} from '../types';

const CHROMATIC_SCALE = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
];

const FLAT_TO_SHARP: Record<string, string> = {
  Db: 'C#',
  Eb: 'D#',
  Fb: 'E',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
  Cb: 'B',
};

const ROOT_REGEX = /^[A-G][#b]?/;

function normalizeRoot(root: string): string {
  return FLAT_TO_SHARP[root] ?? root;
}

export function transposeChord(chord: string, semitones: number): string {
  const rootMatch = chord.match(ROOT_REGEX);
  if (!rootMatch) {
    return chord;
  }
  const root = rootMatch[0];
  const normalizedRoot = normalizeRoot(root);
  const quality = chord.slice(root.length);
  const index = CHROMATIC_SCALE.indexOf(normalizedRoot);
  if (index === -1) {
    return chord;
  }
  const newIndex = (((index + semitones) % 12) + 12) % 12;
  return CHROMATIC_SCALE[newIndex] + quality;
}

export function transposeSong(song: Song, semitones: number): Song {
  return {
    ...song,
    lines: song.lines.map(line => ({
      ...line,
      chords: line.chords.map(chord => ({
        ...chord,
        name: transposeChord(chord.name, semitones),
      })),
    })),
  };
}
