import React, { useState, useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { EatNowFlow } from './components/EatNowFlow';
import { SmartCanteenPicker } from './components/SmartCanteenPicker';

type AppView = 'home' | 'eat-now' | 'canteen';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('home');

  // Automatically scroll to top when navigating between views.
  // We use setTimeout to push this to the end of the event loop, 
  // ensuring it runs AFTER the browser's default scroll restoration logic.
  useEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);
    return () => clearTimeout(timer);
  }, [currentView]);

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