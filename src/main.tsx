import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import Bible365EntryShell from './components/Bible365EntryShell';
import {runBible365QueensTemplateReadback} from './queensTemplateRuntime';
import './index.css';

const root = document.getElementById('root')!;
const qtaReadback = new URLSearchParams(window.location.search).get('qta_runtime') === '1';

if (qtaReadback) {
  root.textContent = JSON.stringify(runBible365QueensTemplateReadback());
} else {
  createRoot(root).render(
    <StrictMode>
      <Bible365EntryShell />
      <App />
    </StrictMode>,
  );
}