import React, {useState, useEffect, useLayoutEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import type {Song} from '../types';
import {
  loadSongs,
  deleteSong,
  seedIfEmpty,
  addSong,
} from '../utils/storage';
import {Colors} from '../theme';

export default function SongListScreen({navigation}: any) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importText, setImportText] = useState('');

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
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <TouchableOpacity
            onPress={() => {
              setImportText('');
              setImportModalVisible(true);
            }}
            style={{
              backgroundColor: Colors.bgTertiary,
              borderRadius: 8,
              paddingVertical: 6,
              paddingHorizontal: 14,
            }}>
            <Text style={{color: Colors.accent, fontSize: 14}}>Import</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('SongEditor', {})}
            style={{
              backgroundColor: Colors.accent,
              borderRadius: 8,
              paddingVertical: 6,
              paddingHorizontal: 14,
              marginRight: 16,
            }}>
            <Text style={{color: Colors.accentForeground, fontSize: 16, fontWeight: 'bold'}}>+</Text>
          </TouchableOpacity>
        </View>
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

  const isValidSong = (obj: any): obj is Song => {
    return (
      obj &&
      typeof obj.title === 'string' &&
      Array.isArray(obj.lines) &&
      obj.lines.every(
        (l: any) =>
          typeof l.lyrics === 'string' &&
          Array.isArray(l.chords) &&
          l.chords.every(
            (c: any) =>
              typeof c.name === 'string' && typeof c.charIndex === 'number',
          ),
      )
    );
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText);
      if (!isValidSong(parsed)) {
        Alert.alert('Invalid Format', 'The pasted text is not a valid song export.');
        return;
      }
      const importedSong: Song = {
        ...parsed,
        id: Date.now().toString(),
      };
      addSong(importedSong).then(() => {
        loadAndSetSongs();
        setImportModalVisible(false);
        setImportText('');
      });
    } catch {
      Alert.alert('Invalid JSON', 'Could not parse the pasted text as JSON.');
    }
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
    <>
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

    <Modal
      visible={importModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setImportModalVisible(false)}>
      <View style={styles.importModalContainer}>
        <View style={styles.importModalHeader}>
          <Text style={styles.importModalTitle}>Import Song</Text>
        </View>
        <TextInput
          style={styles.importTextInput}
          value={importText}
          onChangeText={setImportText}
          placeholder="Paste exported song JSON here..."
          placeholderTextColor="#999"
          multiline
          textAlignVertical="top"
          autoFocus
        />
        <View style={styles.importModalFooter}>
          <TouchableOpacity
            style={styles.importCancelButton}
            onPress={() => setImportModalVisible(false)}>
            <Text style={styles.importCancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.importAddButton,
              importText.trim() === '' && styles.importAddButtonDisabled,
            ]}
            onPress={handleImport}
            disabled={importText.trim() === ''}>
            <Text style={styles.importAddButtonText}>Import</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </>
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
  importModalContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  importModalHeader: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  importModalTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  importTextInput: {
    flex: 1,
    margin: 16,
    backgroundColor: Colors.bgSecondary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: 'monospace',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  importModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  importCancelButton: {
    flex: 1,
    backgroundColor: Colors.bgTertiary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  importCancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  importAddButton: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  importAddButtonDisabled: {
    opacity: 0.4,
  },
  importAddButtonText: {
    color: Colors.accentForeground,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
