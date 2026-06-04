import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {Colors} from './theme';
import SongListScreen from './screens/SongListScreen';
import SongViewScreen from './screens/SongViewScreen';
import SongEditorScreen from './screens/SongEditorScreen';

const Stack = createNativeStackNavigator();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {backgroundColor: Colors.bgSecondary},
          headerTintColor: Colors.textPrimary,
          contentStyle: {backgroundColor: Colors.bg},
        }}>
        <Stack.Screen
          name="SongList"
          component={SongListScreen}
          options={{title: 'My Songs'}}
        />
        <Stack.Screen
          name="SongView"
          component={SongViewScreen}
          options={({route}: any) => ({
            title: route.params?.song?.title ?? 'Song',
          })}
        />
        <Stack.Screen
          name="SongEditor"
          component={SongEditorScreen}
          options={({route}: any) => ({
            title: route.params?.song ? 'Edit Song' : 'New Song',
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
