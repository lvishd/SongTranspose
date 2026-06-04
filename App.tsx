import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {CharWidthProvider} from './src/utils/charWidthContext';
import Navigation from './src/navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <CharWidthProvider>
        <Navigation />
      </CharWidthProvider>
    </SafeAreaProvider>
  );
}
