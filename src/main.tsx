import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import Bible365EntryShell from './components/Bible365EntryShell';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Bible365EntryShell />
    <App />
  </StrictMode>,
);