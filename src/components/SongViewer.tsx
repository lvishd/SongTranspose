import React, {useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import type {Song} from '../types';
import {transposeSong} from '../utils/transpose';
import LineView from './LineView';
import {Colors} from '../theme';

interface Props {
  song: Song;
  onApplyTranspose?: (song: Song) => void;
}

export default function SongViewer({song, onApplyTranspose}: Props) {
  const [transposeOffset, setTransposeOffset] = useState(0);

  const offsetLabel =
    transposeOffset > 0
      ? `+${transposeOffset}`
      : transposeOffset < 0
        ? transposeOffset.toString()
        : '0';

  const handleApply = () => {
    if (transposeOffset !== 0 && onApplyTranspose) {
      const transposed = transposeSong(song, transposeOffset);
      onApplyTranspose(transposed);
      setTransposeOffset(0);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.transposeBar}>
        <TouchableOpacity
          style={styles.transposeButton}
          disabled={transposeOffset <= -11}
          onPress={() => setTransposeOffset(o => o - 1)}>
          <Text style={styles.transposeButtonText}>−1</Text>
        </TouchableOpacity>
        <Text style={styles.transposeLabel}>{offsetLabel}</Text>
        <TouchableOpacity
          style={styles.transposeButton}
          disabled={transposeOffset >= 11}
          onPress={() => setTransposeOffset(o => o + 1)}>
          <Text style={styles.transposeButtonText}>+1</Text>
        </TouchableOpacity>
        {transposeOffset !== 0 && (
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        )}
      </View>

      {song.lines.map((line, i) => (
        <View key={i} style={styles.lineWrapper}>
          <LineView line={line} transposeOffset={transposeOffset} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  transposeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 12,
  },
  transposeButton: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    opacity: 1,
  },
  transposeButtonText: {
    color: Colors.accent,
    fontSize: 16,
    fontWeight: 'bold',
  },
  transposeLabel: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 36,
    textAlign: 'center',
  },
  applyButton: {
    backgroundColor: Colors.accent,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  applyButtonText: {
    color: Colors.accentForeground,
    fontSize: 14,
    fontWeight: 'bold',
  },
  lineWrapper: {
    marginBottom: 12,
  },
});
