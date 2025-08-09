import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Import the CSS file containing Tailwind directives
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    {/* Main App with all integrated components */}
    <App />
  </React.StrictMode>
);

// Performance monitoring (optional)
reportWebVitals();