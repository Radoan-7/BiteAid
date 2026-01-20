import React, { useState } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { EatNowFlow } from './components/EatNowFlow';
import { SmartCanteenPicker } from './components/SmartCanteenPicker';

type AppView = 'home' | 'eat-now' | 'canteen';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('home');

  return (
    <>
      {currentView === 'home' && (
        <HomeScreen onNavigate={setCurrentView} />
      )}
      
      {currentView === 'eat-now' && (
        <EatNowFlow onHome={() => setCurrentView('home')} />
      )}
      
      {currentView === 'canteen' && (
        <SmartCanteenPicker onHome={() => setCurrentView('home')} />
      )}
    </>
  );
};

export default App;