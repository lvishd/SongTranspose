import React, {useState, useEffect, useLayoutEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import type {Song} from '../types';
import {
  loadSongs,
  deleteSong,
  seedIfEmpty,
} from '../utils/storage';
import {Colors} from '../theme';

export default function SongListScreen({navigation}: any) {
  const [songs, setSongs] = useState<Song[]>([]);

  const loadAndSetSongs = useCallback(async () => {
    const loaded = await loadSongs();
    setSongs(loaded);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAndSetSongs();
    }, [loadAndSetSongs]),
  );

  useEffect(() => {
    seedIfEmpty().then(loadAndSetSongs);
  }, [loadAndSetSongs]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('SongEditor', {})}
          style={{marginRight: 16}}>
          <Text style={{color: Colors.accent, fontSize: 16, fontWeight: 'bold'}}>+</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleDelete = (song: Song) => {
    Alert.alert('Delete Song', `Delete "${song.title}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteSong(song.id);
          loadAndSetSongs();
        },
      },
    ]);
  };

  const renderSong = ({item}: {item: Song}) => (
    <TouchableOpacity
      style={styles.songRow}
      onPress={() => navigation.navigate('SongView', {song: item})}>
      <View style={styles.songInfo}>
        <Text style={styles.songTitle}>{item.title}</Text>
      </View>
      <View style={styles.songActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('SongEditor', {song: item})}>
          <Text style={styles.editActionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(item)}>
          <Text style={styles.deleteActionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={songs}
        keyExtractor={item => item.id}
        renderItem={renderSong}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No songs yet.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  songRow: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 8,
    marginVertical: 6,
    padding: 12,
  },
  songInfo: {
    marginBottom: 8,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  songActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: Colors.bgTertiary,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editActionText: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: 'bold',
  },
  deleteActionText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 40,
  },
});
