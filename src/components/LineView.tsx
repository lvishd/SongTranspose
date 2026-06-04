import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {Line} from '../types';
import {useCharWidth} from '../utils/charWidthContext';
import {transposeChord} from '../utils/transpose';
import {Colors} from '../theme';

interface Props {
  line: Line;
  transposeOffset: number;
}

export default function LineView({line, transposeOffset}: Props) {
  const {charWidth} = useCharWidth();
  const rtl = line.rtl === true;

  return (
    <View style={styles.container}>
      <View style={styles.chordRow}>
        {line.chords.map((chord, i) => (
          <Text
            key={i}
            style={[
              styles.chord,
              rtl
                ? {right: chord.charIndex * charWidth}
                : {left: chord.charIndex * charWidth},
            ]}>
            {transposeChord(chord.name, transposeOffset)}
          </Text>
        ))}
      </View>
      <Text
        style={[
          styles.lyrics,
          rtl && styles.lyricsRtl,
        ]}>
        {line.lyrics || '\u00A0'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'visible',
  },
  chordRow: {
    position: 'relative',
    height: 18,
    overflow: 'visible',
  },
  chord: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: '900',
    color: Colors.accent,
    fontFamily: 'monospace',
  },
  lyrics: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  lyricsRtl: {
    textAlign: 'right',
  },
});
