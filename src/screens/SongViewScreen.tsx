import React, {useState, useEffect} from 'react';
import {TouchableOpacity, Text, Share, View} from 'react-native';
import type {Song} from '../types';
import {loadSongs, updateSong} from '../utils/storage';
import {Colors} from '../theme';
import SongViewer from '../components/SongViewer';

export default function SongViewScreen({route, navigation}: any) {
  const song = route.params.song as Song;
  const [currentSong, setCurrentSong] = useState<Song>(song);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      const songs = await loadSongs();
      const updated = songs.find(s => s.id === song.id);
      if (updated) {
        setCurrentSong(updated);
      }
    });
    return unsubscribe;
  }, [navigation, song.id]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <TouchableOpacity
            onPress={() => {
              const json = JSON.stringify(currentSong, null, 2);
              Share.share({message: json, title: currentSong.title});
            }}
            style={{
              backgroundColor: Colors.bgTertiary,
              borderRadius: 8,
              paddingVertical: 6,
              paddingHorizontal: 14,
            }}>
            <Text style={{color: Colors.accent, fontSize: 14}}>
              Export
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('SongEditor', {song: currentSong})
            }
            style={{
              backgroundColor: Colors.bgTertiary,
              borderRadius: 8,
              paddingVertical: 6,
              paddingHorizontal: 14,
              marginRight: 16,
            }}>
            <Text style={{color: Colors.accent, fontSize: 14}}>
              Edit
            </Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, currentSong]);

  const handleApplyTranspose = async (transposed: Song) => {
    await updateSong(transposed);
    setCurrentSong(transposed);
  };

  return (
    <SongViewer song={currentSong} onApplyTranspose={handleApplyTranspose} />
  );
}
