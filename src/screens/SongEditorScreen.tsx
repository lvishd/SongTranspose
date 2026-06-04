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
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <TouchableOpacity
            onPress={() => editorRef.current?.handleAddLine()}
            style={{marginRight: 16}}>
            <Text style={{color: Colors.accent, fontSize: 16}}>+ Line</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => editorRef.current?.handleSave()}>
            <Text style={{color: Colors.accent, fontSize: 16, marginRight: 16}}>
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
