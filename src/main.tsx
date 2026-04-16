import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { InitialPageLoader } from './components/InitialPageLoader';

/** StrictMode is off so dev double-mount does not discard editor state (sections/layout) mid-session. */

function Root() {
  const [loaderGone, setLoaderGone] = useState(false);

  return (
    <>
      <App />
      {!loaderGone ? <InitialPageLoader onDone={() => setLoaderGone(true)} /> : null}
    </>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
