import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import type {Song, Line, Chord} from '../types';
import {useCharWidth} from '../utils/charWidthContext';
import {Colors} from '../theme';
import LineView from './LineView';

export interface SongEditorRef {
  handleAddLine: () => void;
  handleSave: () => void;
}

interface Props {
  initialSong?: Song;
  onSave: (song: Song) => void;
}

const SongEditor = forwardRef<SongEditorRef, Props>(function SongEditor(
  {initialSong, onSave},
  ref,
) {
  const {charWidth, setCharWidth} = useCharWidth();
  const [title, setTitle] = useState(initialSong?.title ?? '');
  const [lines, setLines] = useState<Line[]>(initialSong?.lines ?? []);
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null);
  const [lineMode, setLineMode] = useState<'lyrics' | 'chords'>('chords');
  const [selectedChordIndex, setSelectedChordIndex] = useState<number | null>(
    null,
  );
  const [editingChordAtChar, setEditingChordAtChar] = useState<number | null>(
    null,
  );
  const [chordInput, setChordInput] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (initialSong) {
      setTitle(initialSong.title);
      setLines(initialSong.lines);
    }
  }, [initialSong]);

  const clearChordState = () => {
    setSelectedChordIndex(null);
    setEditingChordAtChar(null);
    setChordInput('');
  };

  const handleOpenLine = (i: number) => {
    setEditingLineIndex(i);
    setLineMode('chords');
    clearChordState();
  };

  const handleCloseLine = () => {
    setEditingLineIndex(null);
    clearChordState();
  };

  const handleToggleRtl = () => {
    if (editingLineIndex === null) {return;}
    setLines(prev =>
      prev.map((l, idx) =>
        idx === editingLineIndex ? {...l, rtl: !l.rtl} : l,
      ),
    );
  };

  const handleMoveLineUp = (i: number) => {
    if (i === 0) {return;}
    const newLines = [...lines];
    [newLines[i - 1], newLines[i]] = [newLines[i], newLines[i - 1]];
    setLines(newLines);
  };

  const handleMoveLineDown = (i: number) => {
    if (i === lines.length - 1) {return;}
    const newLines = [...lines];
    [newLines[i], newLines[i + 1]] = [newLines[i + 1], newLines[i]];
    setLines(newLines);
  };

  const handleDeleteLine = (i: number) => {
    setLines(prev => prev.filter((_, idx) => idx !== i));
    if (editingLineIndex === i) {
      handleCloseLine();
    } else if (editingLineIndex !== null && editingLineIndex > i) {
      setEditingLineIndex(editingLineIndex - 1);
    }
  };

  const handleAddLine = () => {
    setLines(prev => [...prev, {lyrics: '', chords: []}]);
  };

  const handleLyricsChange = (text: string) => {
    if (editingLineIndex === null) {return;}
    setLines(prev =>
      prev.map((l, idx) => (idx === editingLineIndex ? {...l, lyrics: text} : l)),
    );
  };

  const sortChords = (chords: Chord[]): Chord[] => {
    return [...chords].sort((a, b) => a.charIndex - b.charIndex);
  };

  const handleCharacterTap = (charIndex: number) => {
    if (editingLineIndex === null) {return;}
    const currentChords = lines[editingLineIndex].chords;

    if (selectedChordIndex !== null) {
      const newChords = currentChords.map((c, i) =>
        i === selectedChordIndex ? {...c, charIndex} : c,
      );
      setLines(prev =>
        prev.map((l, idx) =>
          idx === editingLineIndex ? {...l, chords: sortChords(newChords)} : l,
        ),
      );
      clearChordState();
      return;
    }

    const existingChordIdx = currentChords.findIndex(
      c => c.charIndex === charIndex,
    );
    if (existingChordIdx !== -1) {
      setSelectedChordIndex(existingChordIdx);
      setChordInput(currentChords[existingChordIdx].name);
      setEditingChordAtChar(null);
      return;
    }

    setEditingChordAtChar(charIndex);
    setSelectedChordIndex(null);
    setChordInput('');
  };

  const handleChordLabelTap = (chordIndex: number) => {
    if (editingLineIndex === null) {return;}
    const chord = lines[editingLineIndex].chords[chordIndex];
    setSelectedChordIndex(chordIndex);
    setChordInput(chord.name);
    setEditingChordAtChar(null);
  };

  const handleDeleteChord = (chordIndex: number) => {
    if (editingLineIndex === null) {return;}
    setLines(prev =>
      prev.map((l, idx) =>
        idx === editingLineIndex
          ? {...l, chords: l.chords.filter((_, i) => i !== chordIndex)}
          : l,
      ),
    );
    if (selectedChordIndex === chordIndex) {
      clearChordState();
    } else if (
      selectedChordIndex !== null &&
      selectedChordIndex > chordIndex
    ) {
      setSelectedChordIndex(selectedChordIndex - 1);
    }
  };

  const handlePlaceOrRename = () => {
    if (editingLineIndex === null || chordInput.trim() === '') {return;}

    if (editingChordAtChar !== null) {
      const newChord: Chord = {
        name: chordInput.trim(),
        charIndex: editingChordAtChar,
      };
      setLines(prev =>
        prev.map((l, idx) =>
          idx === editingLineIndex
            ? {...l, chords: sortChords([...l.chords, newChord])}
            : l,
        ),
      );
      clearChordState();
      return;
    }

    if (selectedChordIndex !== null) {
      setLines(prev =>
        prev.map((l, idx) =>
          idx === editingLineIndex
            ? {
                ...l,
                chords: l.chords.map((c, i) =>
                  i === selectedChordIndex
                    ? {...c, name: chordInput.trim()}
                    : c,
                ),
              }
            : l,
        ),
      );
      clearChordState();
    }
  };

  useImperativeHandle(ref, () => ({
    handleAddLine,
    handleSave,
  }));

  const handleCancelChordEdit = () => {
    clearChordState();
  };

  const adjustCharWidth = (delta: number) => {
    const next = Math.round((charWidth + delta) * 10) / 10;
    if (next >= 1 && next <= 30) {
      setCharWidth(next);
    }
  };

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (trimmedTitle === '') {
      setSaveError('Please enter a song title');
      return;
    }
    setSaveError('');
    const song: Song = {
      id: initialSong?.id ?? Date.now().toString(),
      title: trimmedTitle,
      lines,
    };
    onSave(song);
  };

  const isChordInputVisible =
    editingLineIndex !== null &&
    (editingChordAtChar !== null || selectedChordIndex !== null);
  const placeRenameLabel =
    editingChordAtChar !== null ? 'Place' : 'Rename';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <TextInput
        style={styles.titleInput}
        placeholder="Song title"
        placeholderTextColor="#666"
        value={title}
        onChangeText={t => {
          setTitle(t);
          if (saveError) {setSaveError('');}
        }}
      />

      <View style={styles.alignBar}>
        <Text style={styles.alignLabel}>Align: {charWidth.toFixed(1)}</Text>
        <TouchableOpacity
          style={styles.alignButton}
          onPress={() => adjustCharWidth(-0.1)}>
          <Text style={styles.alignButtonText}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.alignButton}
          onPress={() => adjustCharWidth(0.1)}>
          <Text style={styles.alignButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {lines.map((line, i) => (
        <View key={i}>
          <View style={styles.lineRow}>
            <View style={styles.linePreviewWrapper}>
              <LineView line={line} transposeOffset={0} />
            </View>
            <View style={styles.lineActions}>
              <TouchableOpacity
                style={[
                  styles.lineActionButton,
                  i === 0 && styles.lineActionButtonDisabled,
                ]}
                onPress={() => handleMoveLineUp(i)}
                disabled={i === 0}>
                <Text
                  style={[
                    styles.lineActionText,
                    i === 0 && styles.lineActionTextDisabled,
                  ]}>
                  ↑
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.lineActionButton,
                  i === lines.length - 1 &&
                    styles.lineActionButtonDisabled,
                ]}
                onPress={() => handleMoveLineDown(i)}
                disabled={i === lines.length - 1}>
                <Text
                  style={[
                    styles.lineActionText,
                    i === lines.length - 1 &&
                      styles.lineActionTextDisabled,
                  ]}>
                  ↓
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleOpenLine(i)}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteLine(i)}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>

          {editingLineIndex === i && (
            <View style={styles.editorPanel}>
              <View style={styles.modeToggle}>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    lineMode === 'lyrics' && styles.modeButtonActive,
                  ]}
                  onPress={() => {
                    setLineMode('lyrics');
                    clearChordState();
                  }}>
                  <Text
                    style={[
                      styles.modeButtonText,
                      lineMode === 'lyrics' && styles.modeButtonTextActive,
                    ]}>
                    Lyrics
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modeButton,
                    lineMode === 'chords' && styles.modeButtonActive,
                  ]}
                  onPress={() => setLineMode('chords')}>
                  <Text
                    style={[
                      styles.modeButtonText,
                      lineMode === 'chords' && styles.modeButtonTextActive,
                    ]}>
                    Chords
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.rtlButton,
                    lines[i].rtl && styles.rtlButtonActive,
                  ]}
                  onPress={handleToggleRtl}>
                  <Text
                    style={[
                      styles.rtlButtonText,
                      lines[i].rtl && styles.rtlButtonTextActive,
                    ]}>
                    {lines[i].rtl ? '←' : '→'}
                  </Text>
                </TouchableOpacity>
              </View>

              {lineMode === 'lyrics' && (
                <View>
                  <TextInput
                    style={[styles.lyricsInput, lines[i].rtl && {textAlign: 'right'}]}
                    value={lines[i].lyrics}
                    onChangeText={handleLyricsChange}
                    placeholder="Enter lyrics..."
                    placeholderTextColor="#666"
                    keyboardType="default"
                  />
                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={() => {
                      setLineMode('chords');
                      clearChordState();
                    }}>
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              )}

              {lineMode === 'chords' && (
                <View>
                  {lines[i].lyrics === '' ? (
                    <Text style={styles.emptyLyricsMessage}>
                      Switch to Lyrics mode to add text first.
                    </Text>
                  ) : (
                    <View>
                      <View style={styles.chordOverlay}>
                        {lines[i].chords.map((chord, ci) => (
                          <TouchableOpacity
                            key={ci}
                            style={[
                              styles.chordOverlayLabel,
                              lines[i].rtl
                                ? {right: chord.charIndex * charWidth}
                                : {left: chord.charIndex * charWidth},
                            ]}
                            onPress={() => handleChordLabelTap(ci)}>
                            <Text style={styles.chordOverlayLabelText}>
                              {chord.name}
                            </Text>
                            <TouchableOpacity
                              onPress={() => handleDeleteChord(ci)}
                              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                              <Text style={styles.chordOverlayDelete}>×</Text>
                            </TouchableOpacity>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.characterStrip}>
                        <View style={{flexDirection: lines[i].rtl ? 'row-reverse' : 'row'}}>
                        {lines[i].lyrics.split('').map((char, j) => {
                          const hasChord = lines[i].chords.some(
                            c => c.charIndex === j,
                          );
                          const isSelected =
                            selectedChordIndex !== null &&
                            lines[i].chords[selectedChordIndex]?.charIndex ===
                              j;
                          const isPlacementTarget =
                            !hasChord && editingChordAtChar === j;

                          let cellStyle = styles.cellNormal;
                          if (isSelected) {
                            cellStyle = styles.cellSelected;
                          } else if (hasChord) {
                            cellStyle = styles.cellHasChord;
                          } else if (isPlacementTarget) {
                            cellStyle = styles.cellPlacementTarget;
                          }

                          return (
                            <TouchableOpacity
                              key={j}
                              style={[styles.cell, cellStyle, {width: charWidth}]}
                              onPress={() => handleCharacterTap(j)}>
                              <Text style={styles.cellText}>{char}</Text>
                            </TouchableOpacity>
                          );
                        })}
                        </View>
                      </ScrollView>

                      {isChordInputVisible && (
                        <View style={styles.chordInputRow}>
                          <TextInput
                            style={styles.chordNameInput}
                            value={chordInput}
                            onChangeText={setChordInput}
                            placeholder="Chord name"
                            placeholderTextColor="#666"
                            autoCapitalize="none"
                          />
                          <TouchableOpacity
                            style={[
                              styles.chordActionButton,
                              chordInput.trim() === '' &&
                                styles.chordActionButtonDisabled,
                            ]}
                            onPress={handlePlaceOrRename}
                            disabled={chordInput.trim() === ''}>
                            <Text style={styles.chordActionButtonText}>
                              {placeRenameLabel}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.chordCancelButton}
                            onPress={handleCancelChordEdit}>
                            <Text style={styles.chordCancelButtonText}>
                              Cancel
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      <View style={styles.chordPills}>
                        {lines[i].chords.map((chord, ci) => (
                          <View key={ci} style={styles.chordPill}>
                            <TouchableOpacity
                              onPress={() => handleChordLabelTap(ci)}>
                              <Text style={styles.chordPillName}>
                                {chord.name}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDeleteChord(ci)}>
                              <Text style={styles.chordPillDelete}>×</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      ))}

      {saveError !== '' && (
        <Text style={styles.saveError}>{saveError}</Text>
      )}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 60,
  },
  titleInput: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 20,
    fontFamily: 'monospace',
    color: Colors.textPrimary,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  artistInput: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: 'monospace',
    color: Colors.textPrimary,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  lineRow: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 8,
    marginVertical: 6,
    padding: 12,
  },
  linePreviewWrapper: {
    marginBottom: 8,
  },
  lineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lineActionButton: {
    backgroundColor: Colors.bgTertiary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  lineActionButtonDisabled: {
    opacity: 0.3,
  },
  lineActionText: {
    color: Colors.textPrimary,
    fontSize: 14,
  },
  lineActionTextDisabled: {
    color: Colors.disabled,
  },
  editButton: {
    backgroundColor: Colors.bgTertiary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editButtonText: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: Colors.bgTertiary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  deleteButtonText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: 'bold',
  },
  editorPanel: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
  },
  modeToggle: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  modeButton: {
    flex: 1,
    backgroundColor: Colors.bgTertiary,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: Colors.accent,
  },
  modeButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  modeButtonTextActive: {
    color: Colors.accentForeground,
  },
  rtlButton: {
    backgroundColor: Colors.bgTertiary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  rtlButtonActive: {
    backgroundColor: Colors.accent,
  },
  rtlButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  rtlButtonTextActive: {
    color: Colors.accentForeground,
  },
  warning: {
    color: Colors.accent,
    fontSize: 12,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  lyricsInput: {
    backgroundColor: Colors.bgTertiary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  doneButton: {
    backgroundColor: Colors.accent,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-end',
  },
  doneButtonText: {
    color: Colors.accentForeground,
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyLyricsMessage: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'center',
    paddingVertical: 12,
  },
  chordOverlay: {
    position: 'relative',
    height: 28,
    marginBottom: 4,
    overflow: 'visible',
  },
  chordOverlayLabel: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  chordOverlayLabelText: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.accent,
    fontFamily: 'monospace',
  },
  chordOverlayDelete: {
    color: Colors.danger,
    fontSize: 14,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  characterStrip: {
    flexDirection: 'row',
    marginBottom: 10,
    minHeight: 36,
  },
  cell: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cellNormal: {
    backgroundColor: 'transparent',
  },
  cellSelected: {
    backgroundColor: Colors.accent,
  },
  cellHasChord: {
    backgroundColor: Colors.chordCell,
    borderTopWidth: 2,
    borderTopColor: Colors.accent,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cellPlacementTarget: {
    backgroundColor: Colors.placementCell,
    borderBottomWidth: 2,
    borderBottomColor: Colors.info,
  },
  cellText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: Colors.textPrimary,
  },
  chordInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  chordNameInput: {
    flex: 1,
    backgroundColor: Colors.bgTertiary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: 'monospace',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chordActionButton: {
    backgroundColor: Colors.accent,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chordActionButtonDisabled: {
    opacity: 0.4,
  },
  chordActionButtonText: {
    color: Colors.accentForeground,
    fontWeight: 'bold',
    fontSize: 14,
  },
  chordCancelButton: {
    backgroundColor: Colors.bgTertiary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chordCancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  chordPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chordPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgTertiary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  chordPillName: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  chordPillDelete: {
    color: Colors.danger,
    fontSize: 14,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  alignBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  alignLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: 'monospace',
    marginRight: 4,
  },
  alignButton: {
    backgroundColor: Colors.bgTertiary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  alignButtonText: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveError: {
    color: Colors.danger,
    fontSize: 14,
    marginBottom: 8,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default SongEditor;
