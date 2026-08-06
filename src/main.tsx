import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { startProductPrefetch } from './utils/productPrefetch';

// Before React: on a product URL this is the LCP-critical request.
startProductPrefetch(window.location.pathname);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
