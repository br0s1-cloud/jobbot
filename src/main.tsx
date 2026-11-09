import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './index.css';
import { DemoApp } from './DemoApp';
import { FullScreenMessage, ErrorBoundary } from './components/ui/States';

// The live app (and the Firebase SDK) is a separate chunk that only /atlas ever downloads.
const LiveApp = lazy(() => import('./live/LiveApp'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Routes>
        <Route path="/" element={<DemoApp />} />
        <Route
          path="/atlas/*"
          element={
            <Suspense fallback={<FullScreenMessage title="Loading your territory…" />}>
              <LiveApp />
            </Suspense>
          }
        />
        <Route path="*" element={<FullScreenMessage title="Page not found" body="That page doesn't exist." action={{ label: 'Open the demo', href: import.meta.env.BASE_URL }} />} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
