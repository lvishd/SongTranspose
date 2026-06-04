# SongTranspose — AI Agent Prompt

You are building a React Native Android app called SongTranspose. The project has already been initialised with:

  npx @react-native-community/cli@latest init SongTranspose

The project is empty (default template). Do not use Expo. Target Android only.

────────────────────────────────────────
PURPOSE
────────────────────────────────────────
The app displays songs where chords appear above the lyrics, aligned by character position. Example:

        Am           Gm
Those are some words

             Dm                              C
Those are some other words

The horizontal position of each chord indicates the syllable where the chord change occurs. This alignment must be preserved exactly using a monospace font so that charIndex × charWidth maps to a pixel x-offset.

────────────────────────────────────────
DATA MODEL  (src/types.ts)
────────────────────────────────────────
interface Chord {
  name: string;       // e.g. "Am", "Gm7", "C#dim"
  charIndex: number;  // 0-based index into the lyrics string
}

interface Line {
  lyrics: string;     // the lyric text for this line
  chords: Chord[];    // sorted ascending by charIndex
}

interface Song {
  id: string;
  title: string;
  artist?: string;
  lines: Line[];
}

────────────────────────────────────────
FILE STRUCTURE  (create exactly this)
────────────────────────────────────────
src/
  types.ts
  constants.ts
  navigation.tsx
  utils/
    transpose.ts
    storage.ts
  components/
    LineView.tsx
    SongViewer.tsx
    SongEditor.tsx
  screens/
    SongListScreen.tsx
    SongViewScreen.tsx
    SongEditorScreen.tsx
App.tsx  (replace the default)

────────────────────────────────────────
DEPENDENCIES TO INSTALL
────────────────────────────────────────
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
npm install @react-native-async-storage/async-storage

Run `npx pod-install` only if targeting iOS — skip it here.

────────────────────────────────────────
IMPLEMENTATION DETAILS
────────────────────────────────────────

## src/constants.ts

Export a single shared constant used by both LineView and SongEditor:

  export const CHAR_WIDTH = 9.6;
  // Approximate pixel width of one monospace character at fontSize 16 with Courier New.
  // Adjust this value if chord alignment looks off on the target device.

────────────────────────────────────────

## src/types.ts

export interface Chord {
  name: string;
  charIndex: number;
}

export interface Line {
  lyrics: string;
  chords: Chord[];
}

export interface Song {
  id: string;
  title: string;
  artist?: string;
  lines: Line[];
}

────────────────────────────────────────

## src/utils/transpose.ts

Build a chromatic scale with 12 notes:
  ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']

Flat-to-sharp aliases map (apply before lookup):
  Db→C#  Eb→D#  Fb→E  Gb→F#  Ab→G#  Bb→A#  Cb→B

Export:

  transposeChord(chord: string, semitones: number): string
    — chord name = root + quality suffix
    — root is matched by /^[A-G][#b]?/
    — quality suffix is everything after the root (e.g. "m", "7", "maj7", "dim", "sus2", "")
    — normalize flat root to sharp equivalent, find index in scale,
      add semitones, mod 12, return new root + original suffix
    — semitones can be any integer (positive or negative)

  transposeSong(song: Song, semitones: number): Song
    — deep-clones the song object (do not mutate)
    — applies transposeChord to every chord in every line
    — returns the new Song

────────────────────────────────────────

## src/utils/storage.ts

Use @react-native-async-storage/async-storage.
Storage key: 'songs_v1'

Export all of these:

  loadSongs(): Promise<Song[]>
    — parse JSON from storage; return [] if key missing or parse fails

  saveSongs(songs: Song[]): Promise<void>
    — serialize and write the full array

  addSong(song: Song): Promise<void>
    — load current list, append, save

  updateSong(song: Song): Promise<void>
    — load current list, replace item where id matches, save

  deleteSong(id: string): Promise<void>
    — load current list, filter out id, save

  seedIfEmpty(): Promise<void>
    — if loadSongs() returns [], insert one example song (see SEED DATA section)

────────────────────────────────────────

## src/components/LineView.tsx

Props:
  line: Line
  transposeOffset: number

Render two rows stacked vertically inside a View with overflow: 'visible':

  Row 1 — Chord row
    View with { position: 'relative', height: 24 }
    For each chord in line.chords:
      <Text style={{
        position: 'absolute',
        left: chord.charIndex * CHAR_WIDTH,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#f0a500',
        fontFamily: 'Courier New',
      }}>
        {transposeChord(chord.name, transposeOffset)}
      </Text>

  Row 2 — Lyric row
    <Text style={{ fontSize: 16, fontFamily: 'Courier New', color: '#f0f0f0' }}>
      {line.lyrics}
    </Text>

Import CHAR_WIDTH from src/constants.ts.
Import transposeChord from src/utils/transpose.ts.
If line.lyrics is empty, render a non-breaking space so the row has height.

────────────────────────────────────────

## src/components/SongViewer.tsx

Props:
  song: Song

Internal state:
  transposeOffset: number  (initial 0)

Render a ScrollView containing:
  1. Title (large, bold) + artist (smaller, dimmed) header
  2. Transpose bar — a horizontal row with:
       [−1] button  |  offset label ("+2", "0", "−1", etc.)  |  [+1] button
     Pressing −1 decrements transposeOffset; +1 increments.
  3. For each line in song.lines:
       <LineView line={line} transposeOffset={transposeOffset} />
       Add vertical spacing (marginBottom: 12) between lines.

Pass transposeOffset directly to LineView — do not pre-compute transposed lines in SongViewer.
LineView handles transposition internally via transposeChord.

────────────────────────────────────────

## src/components/SongEditor.tsx

Props:
  initialSong?: Song
  onSave: (song: Song) => void

─── State ───────────────────────────────

  title: string
  artist: string
  lines: Line[]

  editingLineIndex: number | null
    which line is open in the editor panel

  lineMode: 'lyrics' | 'chords'
    two mutually exclusive sub-modes for the open line:
      'lyrics' → user edits the text string; chord panel hidden
      'chords' → lyric text locked; user manages chords

  selectedChordIndex: number | null
    null   → no chord selected; tapping a char places a NEW chord there
    number → index into lines[editingLineIndex].chords;
             tapping a char MOVES this chord there

  editingChordAtChar: number | null
    set when user taps an empty char to place a new chord

  chordInput: string
    chord name being typed (used for both new placement and rename)

─── Initialization ──────────────────────

If initialSong is provided:
  pre-populate title, artist, lines from it.
  onSave receives the song with the same id.

If initialSong is undefined:
  start with empty title, artist, lines = [].
  generate id = Date.now().toString() when saving.

─── Top-level layout ────────────────────

  TextInput for title (placeholder "Song title")
  TextInput for artist (placeholder "Artist (optional)")
  List of line rows (see below)
  [+ Add line] button
  [Save song] button

─── Line row (collapsed) ────────────────

For each line at index i, render:

  ┌──────────────────────────────────────────┐
  │  Chord/lyric preview (same as LineView,  │
  │  transposeOffset=0)                      │
  │  [↑] [↓]  [Edit]  [Delete]              │
  └──────────────────────────────────────────┘

  [↑] moves line up (disabled if i === 0)
  [↓] moves line down (disabled if i === lines.length - 1)
  [Edit] sets editingLineIndex = i, lineMode = 'chords' (default to chords mode)
  [Delete] removes the line from the array

─── Editor panel (expanded, below the row) ─

Shown only when editingLineIndex === i.

  Mode toggle: two buttons side by side
    [ Lyrics ]  [ Chords ]
    The active mode button is visually highlighted (amber background).

  ── IF lineMode === 'lyrics' ─────────────

    If the line has existing chords, show a warning banner:
      "⚠ Changing lyrics may misalign chord positions. Review chords after editing."

    TextInput bound to lines[i].lyrics (single line, monospace font).
    [Done] button → switches lineMode to 'chords', clears chord input state.

  ── IF lineMode === 'chords' ─────────────

    CHARACTER STRIP
      Horizontal ScrollView.
      For each character in lines[i].lyrics at index j, render a TouchableOpacity cell:
        width: CHAR_WIDTH  (use a minimum of 20 for tap target, visual width CHAR_WIDTH)
        height: 36
        fontFamily: 'Courier New', fontSize: 16

      Visual states (apply in this priority order):
        1. selectedChordIndex is set AND lines[i].chords[selectedChordIndex].charIndex === j
           → bright amber background (#f0a500), dark text
        2. a chord exists at charIndex === j (but not the selected one)
           → amber top border (2px), light amber tint background (#3a2e00)
        3. editingChordAtChar === j (placement target, no chord yet)
           → blue highlight (#1a3a5c background, #4fc3f7 border)
        4. normal
           → subtle border (#333), transparent background

      Above the strip, render a chord overlay row:
        View { position: 'relative', height: 24, marginBottom: 4 }
        For each chord in lines[i].chords:
          TouchableOpacity {
            position: 'absolute',
            left: chord.charIndex * CHAR_WIDTH,
          }
          Text (amber, bold, Courier New, fontSize 13): chord.name
          Small [×] TouchableOpacity next to the name to delete the chord.

        Tapping a chord label:
          → sets selectedChordIndex = that chord's index
          → sets chordInput = chord.name
          → clears editingChordAtChar

      Tapping a character in the strip:
        if selectedChordIndex !== null:
          → MOVE: update lines[i].chords[selectedChordIndex].charIndex = j
          → re-sort lines[i].chords by charIndex
          → clear selectedChordIndex and chordInput
        else if a chord already exists at charIndex j:
          → SELECT it: selectedChordIndex = its index, chordInput = its name
        else:
          → SET PLACEMENT TARGET: editingChordAtChar = j, chordInput = ''

    If lines[i].lyrics is empty, show a message:
      "Switch to Lyrics mode to add text first."
      and disable the character strip.

    CHORD INPUT ROW
      Shown when editingChordAtChar !== null OR selectedChordIndex !== null.

      [ TextInput (chordInput) ] [ Place / Rename ] [ Cancel ]

      Button label:
        editingChordAtChar !== null → "Place"
        selectedChordIndex !== null → "Rename"

      "Place" action:
        → add Chord { name: chordInput.trim(), charIndex: editingChordAtChar } to lines[i].chords
        → re-sort by charIndex
        → clear editingChordAtChar and chordInput

      "Rename" action:
        → update lines[i].chords[selectedChordIndex].name = chordInput.trim()
        → clear selectedChordIndex and chordInput

      "Cancel":
        → clear editingChordAtChar, selectedChordIndex, chordInput

      Disable Place/Rename if chordInput.trim() is empty.

    CHORD PILLS LIST
      Below the strip, show all chords for lines[i] as a horizontal wrap of pills:
        [ Am × ]  [ Gm × ]  [ C × ]

      Tapping the name part of a pill:
        → same as tapping its label in the overlay (select it)
      Tapping [×]:
        → delete the chord from lines[i].chords

─── Saving ──────────────────────────────

[Save song] calls onSave with:
  { id, title: title.trim(), artist: artist.trim(), lines }

Validate: title must not be empty. If empty, show an inline error message
  "Please enter a song title" and do not call onSave.

────────────────────────────────────────

## src/screens/SongListScreen.tsx

Load songs with useFocusEffect (not just useMount) so the list refreshes
after returning from the editor:

  useFocusEffect(
    React.useCallback(() => { loadAndSetSongs(); }, [])
  );

Import useFocusEffect from @react-navigation/native.

Call seedIfEmpty() once on first mount (useEffect with [] deps) before loading.

Each song row:
  Song title (bold) + artist (dimmed)
  [ View ]  [ Edit ]  [ Delete ]

  View   → navigate('SongView', { song })
  Edit   → navigate('SongEditor', { song })
  Delete → call deleteSong(song.id), reload list; show a simple Alert.confirm first

Floating [+] button (bottom-right, circular, amber) → navigate('SongEditor', {})

────────────────────────────────────────

## src/screens/SongViewScreen.tsx

Route params: { song: Song }

On focus, reload the song from storage by id so edits are reflected:
  navigation.addListener('focus', async () => {
    const songs = await loadSongs();
    const updated = songs.find(s => s.id === song.id);
    if (updated) setCurrentSong(updated);
  });

State: currentSong (initialised from route params, updated on focus).

Render <SongViewer song={currentSong} />.

Header right button:
  navigation.setOptions({
    headerRight: () => (
      <TouchableOpacity onPress={() => navigation.navigate('SongEditor', { song: currentSong })}>
        <Text style={{ color: '#f0a500', marginRight: 16, fontSize: 16 }}>Edit</Text>
      </TouchableOpacity>
    ),
  });

────────────────────────────────────────

## src/screens/SongEditorScreen.tsx

Route params: { song?: Song }

Render:
  <SongEditor
    initialSong={route.params?.song}
    onSave={handleSave}
  />

handleSave(song: Song):
  if route.params?.song exists → call updateSong(song)
  else → call addSong(song)
  then → navigation.navigate('SongList')

────────────────────────────────────────

## src/navigation.tsx

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

Stack screens:
  SongList    → SongListScreen    (title: 'My Songs')
  SongView    → SongViewScreen    (title: song.title from params, or 'Song')
  SongEditor  → SongEditorScreen  (title: song param present ? 'Edit Song' : 'New Song')

Dark theme:
  headerStyle: { backgroundColor: '#1e1e1e' }
  headerTintColor: '#f0f0f0'
  contentStyle: { backgroundColor: '#121212' }

Export default function Navigation() wrapping everything in NavigationContainer.

────────────────────────────────────────

## App.tsx

import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from './src/navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <Navigation />
    </SafeAreaProvider>
  );
}

────────────────────────────────────────
SEED DATA
────────────────────────────────────────

In seedIfEmpty(), insert this song if storage is empty:

{
  id: 'seed_1',
  title: 'Example Song',
  artist: 'Demo Artist',
  lines: [
    {
      lyrics: 'Those are some words here',
      chords: [
        { name: 'Am', charIndex: 0 },
        { name: 'Gm', charIndex: 13 },
      ],
    },
    {
      lyrics: '',
      chords: [],
    },
    {
      lyrics: 'Those are some other words',
      chords: [
        { name: 'Dm', charIndex: 13 },
        { name: 'C', charIndex: 32 },
      ],
    },
    {
      lyrics: '',
      chords: [],
    },
    {
      lyrics: 'A final line with more chords',
      chords: [
        { name: 'F', charIndex: 0 },
        { name: 'G', charIndex: 9 },
        { name: 'Am', charIndex: 19 },
      ],
    },
  ],
}

────────────────────────────────────────
STYLE GUIDELINES
────────────────────────────────────────
- Use React Native StyleSheet for all styles — no inline style objects except where dynamic values require it
- Color palette:
    background primary:   #121212
    background secondary: #1e1e1e
    background tertiary:  #2a2a2a
    text primary:         #f0f0f0
    text secondary:       #aaaaaa
    accent (chords):      #f0a500
    danger (delete):      #e53935
    info (selection):     #4fc3f7
- Monospace font: 'Courier New' throughout chord/lyric display and the character strip
- Buttons: borderRadius 8, paddingVertical 8, paddingHorizontal 14
- Card/row containers: borderRadius 8, backgroundColor #1e1e1e, marginVertical 6, padding 12
- Keep the UI clean and minimal — this is a utility app, not a design showcase

────────────────────────────────────────
CONSTRAINTS
────────────────────────────────────────
- No Expo, no Expo libraries
- No external UI libraries — React Native core components only
- No TypeScript strict errors (tsconfig: "strict": true)
- Android target only — no iOS-specific code needed
- The chord horizontal alignment is the core feature:
    ALWAYS use absolute positioning with left = charIndex * CHAR_WIDTH
    NEVER approximate alignment with flexbox or flex gaps
- CHAR_WIDTH must be imported from src/constants.ts in both LineView.tsx and SongEditor.tsx
  — it must never be duplicated or hardcoded in component files

────────────────────────────────────────
DELIVERABLE
────────────────────────────────────────
Produce every file listed in the FILE STRUCTURE section, complete and production-ready.
The app must run without errors with:

  npx react-native run-android

Do not skip any file. Do not leave placeholder comments like "// implement later" or "// TODO".
Every function must be fully implemented.
