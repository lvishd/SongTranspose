export interface Chord {
  name: string;
  charIndex: number;
}

export interface Line {
  lyrics: string;
  chords: Chord[];
  rtl?: boolean;
}

export interface Song {
  id: string;
  title: string;
  lines: Line[];
}
