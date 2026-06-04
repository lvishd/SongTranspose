import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {View, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {CHAR_WIDTH as DEFAULT_CHAR_WIDTH} from '../constants';

const STORAGE_KEY = 'char_width_v1';
const MEASURE_STRING = 'MMMMMMMMMM';

interface CharWidthContextValue {
  charWidth: number;
  setCharWidth: (w: number) => Promise<void>;
}

const CharWidthContext = createContext<CharWidthContextValue>({
  charWidth: DEFAULT_CHAR_WIDTH,
  setCharWidth: async () => {},
});

export function CharWidthProvider({children}: {children: ReactNode}) {
  const [charWidth, setCharWidthState] = useState(DEFAULT_CHAR_WIDTH);
  const [needsMeasure, setNeedsMeasure] = useState(false);
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw !== null) {
        const parsed = parseFloat(raw);
        if (!isNaN(parsed) && parsed > 0) {
          setCharWidthState(parsed);
        } else {
          setNeedsMeasure(true);
        }
      } else {
        setNeedsMeasure(true);
      }
      setInitialised(true);
    });
  }, []);

  const setCharWidth = useCallback(async (w: number) => {
    setCharWidthState(w);
    await AsyncStorage.setItem(STORAGE_KEY, w.toString());
  }, []);

  const handleMeasure = useCallback((width: number) => {
    const perChar = Math.round((width / MEASURE_STRING.length) * 10) / 10;
    if (perChar > 0) {
      setCharWidthState(perChar);
      AsyncStorage.setItem(STORAGE_KEY, perChar.toString());
    }
    setNeedsMeasure(false);
  }, []);

  return (
    <CharWidthContext.Provider value={{charWidth, setCharWidth}}>
      {initialised && needsMeasure && (
        <View style={{position: 'absolute', left: -9999}}>
          <Text
            style={{fontFamily: 'monospace', fontSize: 16, opacity: 0}}
            onLayout={e => handleMeasure(e.nativeEvent.layout.width)}>
            {MEASURE_STRING}
          </Text>
        </View>
      )}
      {children}
    </CharWidthContext.Provider>
  );
}

export function useCharWidth() {
  return useContext(CharWidthContext);
}
