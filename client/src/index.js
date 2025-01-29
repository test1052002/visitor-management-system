import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ClerkProvider, ClerkLoaded, ClerkLoading } from '@clerk/clerk-react';
import reportWebVitals from './reportWebVitals';

const PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env.local file');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/" afterSignUpUrl="/dashboard" afterSignInUrl="/dashboard">
      <ClerkLoading>
        <p>Loading...</p> {/* Prevents blank screen */}
      </ClerkLoading>
      <ClerkLoaded>
        <App />
      </ClerkLoaded>
    </ClerkProvider>
  </React.StrictMode>
);

reportWebVitals();
