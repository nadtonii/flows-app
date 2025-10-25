import { useEffect, useRef, useState } from 'react';
import InfiniteCanvas from './components/InfiniteCanvas.jsx';
import LandingPage from './components/LandingPage.jsx';
import OnboardingOverlay from './components/OnboardingOverlay.jsx';

export default function App() {
  const [isLandingVisible, setIsLandingVisible] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [showCanvas, setShowCanvas] = useState(false);
  const [isCanvasVisible, setIsCanvasVisible] = useState(false);
  const [shouldRenderOverlay, setShouldRenderOverlay] = useState(false);
  const [overlayVisibility, setOverlayVisibility] = useState('hidden');
  const [overlayDismissed, setOverlayDismissed] = useState(false);

  const transitionTimeoutRef = useRef(null);
  const overlayTimeoutRef = useRef(null);
  const transitionStartedRef = useRef(false);

  const LANDING_TRANSITION_MS = 400;
  const OVERLAY_TRANSITION_MS = 320;

  const runAfterPaint = (callback) => {
    if (typeof window !== 'undefined' && window.requestAnimationFrame) {
      window.requestAnimationFrame(() => {
        callback();
      });
      return;
    }

    callback();
  };

  const handleTryItNow = () => {
    if (transitionStartedRef.current) {
      return;
    }

    transitionStartedRef.current = true;
    setShowCanvas(true);
    setIsLandingVisible(false);

    runAfterPaint(() => {
      setIsCanvasVisible(true);
    });

    transitionTimeoutRef.current = setTimeout(() => {
      setShowLanding(false);

      if (!overlayDismissed) {
        setShouldRenderOverlay(true);
        runAfterPaint(() => {
          setOverlayVisibility('visible');
        });
      }
    }, LANDING_TRANSITION_MS);
  };

  const handleExplore = () => {
    setOverlayVisibility('hiding');

    overlayTimeoutRef.current = setTimeout(() => {
      setShouldRenderOverlay(false);
      setOverlayVisibility('hidden');
      setOverlayDismissed(true);
    }, OVERLAY_TRANSITION_MS);
  };

  useEffect(() => () => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    if (overlayTimeoutRef.current) {
      clearTimeout(overlayTimeoutRef.current);
    }
  }, []);

  return (
    <div className="app-stage">
      {showLanding ? (
        <div
          className={`app-stage__screen app-stage__screen--landing ${
            isLandingVisible ? 'app-stage__screen--visible' : 'app-stage__screen--hidden'
          }`}
        >
          <LandingPage onTryItNow={handleTryItNow} />
        </div>
      ) : null}

      {showCanvas ? (
        <div
          className={`app-stage__screen app-stage__screen--canvas ${
            isCanvasVisible ? 'app-stage__screen--visible' : 'app-stage__screen--hidden'
          }`}
        >
          <InfiniteCanvas />
          {shouldRenderOverlay ? (
            <OnboardingOverlay
              onExplore={handleExplore}
              visibility={overlayVisibility}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
