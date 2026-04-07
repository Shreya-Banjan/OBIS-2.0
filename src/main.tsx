import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

/** StrictMode is off so dev double-mount does not discard editor state (sections/layout) mid-session. */
createRoot(document.getElementById('root')!).render(<App />);
