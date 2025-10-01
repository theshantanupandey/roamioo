
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './capacitor.css'

// Set global React reference as safety net
(globalThis as any).React = React;

// Set document title for the app
document.title = 'Roamio';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
