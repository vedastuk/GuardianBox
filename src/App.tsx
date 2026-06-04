import { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import DemoUpload from './components/DemoUpload';
import HowItWorks from './components/HowItWorks';
import Pricing from './components/Pricing';
import Footer from './components/Footer';
import DecryptPage from './components/DecryptPage';
import AuthPage, { getSession, clearSession, type UserData } from './components/AuthPage';
import PaymentPage from './components/PaymentPage';

type Route =
  | { page: 'home' }
  | { page: 'auth'; mode: 'signin' | 'signup' }
  | { page: 'decrypt'; fileId: string; password: string }
  | { page: 'pay'; planId: string };

function parseHash(): Route {
  const hash = window.location.hash;

  if (hash === '#signin') return { page: 'auth', mode: 'signin' };
  if (hash === '#signup') return { page: 'auth', mode: 'signup' };

  const payMatch = hash.match(/^#pay\/(.+)$/);
  if (payMatch) return { page: 'pay', planId: payMatch[1] };

  // #decrypt/{fileId}/{password}
  const decryptMatch = hash.match(/^#decrypt\/([^/]+)\/(.+)$/);
  if (decryptMatch) return { page: 'decrypt', fileId: decryptMatch[1], password: decodeURIComponent(decryptMatch[2]) };

  // #decrypt/{fileId} (no password)
  const decryptMatch2 = hash.match(/^#decrypt\/([^/]+)$/);
  if (decryptMatch2) return { page: 'decrypt', fileId: decryptMatch2[1], password: '' };

  return { page: 'home' };
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseHash());
  const [user, setUser] = useState<UserData | null>(() => getSession());

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseHash());
      setUser(getSession());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const goHome = useCallback(() => {
    window.location.hash = '';
    setRoute({ page: 'home' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleAuthSuccess = useCallback((userData: UserData) => {
    setUser(userData);
    goHome();
  }, [goHome]);

  const handleLogout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  if (route.page === 'auth') {
    return (
      <AuthPage
        initialMode={route.mode}
        onSuccess={handleAuthSuccess}
        onBack={goHome}
      />
    );
  }

  if (route.page === 'pay') {
    return (
      <PaymentPage
        planId={route.planId}
        onBack={() => {
          window.location.hash = '';
          setRoute({ page: 'home' });
          setTimeout(() => {
            const el = document.querySelector('#pricing');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
        onSuccess={goHome}
      />
    );
  }

  if (route.page === 'decrypt') {
    return (
      <DecryptPage
        fileId={route.fileId}
        passwordFromHash={route.password}
        onBack={goHome}
      />
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-dark-100 overflow-x-hidden">
      <Navbar user={user} onLogout={handleLogout} />
      <Hero />
      <Features />
      <DemoUpload />
      <HowItWorks />
      <Pricing />
      <Footer />
    </div>
  );
}
