import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ThemeProvider } from './src/theme/ThemeContext';
import ThemedRoot        from './src/theme/ThemedRoot';
import GameScreen        from './src/components/GameScreen';
import { hydrateStats }  from './src/engine/stats';

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrateStats().finally(() => setReady(true));
  }, []);

  return (
    <ThemeProvider>
      <ThemedRoot>
        {ready ? <GameScreen /> : <View style={{ flex: 1 }} />}
      </ThemedRoot>
    </ThemeProvider>
  );
}
