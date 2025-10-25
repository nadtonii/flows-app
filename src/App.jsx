import { useState } from 'react';
import InfiniteCanvas from './components/InfiniteCanvas.jsx';
import LandingPage from './components/LandingPage.jsx';

export default function App() {
  const [showCanvas, setShowCanvas] = useState(false);

  if (showCanvas) {
    return <InfiniteCanvas />;
  }

  return <LandingPage onTryItNow={() => setShowCanvas(true)} />;
}
