import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const savedTheme = window.localStorage.getItem('tunidex-theme');
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
document.documentElement.classList.toggle('dark', savedTheme === 'dark' || (!savedTheme && prefersDark));

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
