import React, {useRef, useLayoutEffect} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import type {Song} from '../types';
import {addSong, updateSong} from '../utils/storage';
import {Colors} from '../theme';
import SongEditor, {SongEditorRef} from '../components/SongEditor';

export default function SongEditorScreen({route, navigation}: any) {
  const song = route.params?.song as Song | undefined;
  const editorRef = useRef<SongEditorRef>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <TouchableOpacity
            onPress={() => editorRef.current?.handleAddParagraph()}
            style={{
              backgroundColor: Colors.bgTertiary,
              borderRadius: 8,
              paddingVertical: 6,
              paddingHorizontal: 12,
            }}>
            <Text style={{color: Colors.accent, fontSize: 14}}>+ §</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => editorRef.current?.handleAddLine()}
            style={{
              backgroundColor: Colors.bgTertiary,
              borderRadius: 8,
              paddingVertical: 6,
              paddingHorizontal: 12,
            }}>
            <Text style={{color: Colors.accent, fontSize: 14}}>+ Line</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => editorRef.current?.handleSave()}
            style={{
              backgroundColor: Colors.accent,
              borderRadius: 8,
              paddingVertical: 6,
              paddingHorizontal: 14,
              marginRight: 16,
            }}>
            <Text style={{color: Colors.accentForeground, fontSize: 14}}>
              Save
            </Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  const handleSave = async (savedSong: Song) => {
    if (song) {
      await updateSong(savedSong);
    } else {
      await addSong(savedSong);
    }
    navigation.reset({
      index: 1,
      routes: [
        {name: 'SongList'},
        {name: 'SongView', params: {song: savedSong}},
      ],
    });
  };

  return <SongEditor ref={editorRef} initialSong={song} onSave={handleSave} />;
}
