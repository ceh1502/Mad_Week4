import React, { useRef } from 'react';
import InitPage from './pages/InitPage.jsx';
import Signin from './pages/Signin.jsx';
import Signup from './pages/Signup.jsx';
import './App.css';

function App() {
  const signinRef = useRef(null);   // ✅ Signin 위치 참조
  const signupRef = useRef(null);   // ✅ Signup 위치 참조

  const scrollToSignin = () => {
    const targetY = signinRef.current.offsetTop;
    const duration = 1000;
    const startY = window.scrollY;
    const diff = targetY - startY;
    const startTime = performance.now();

    const easeInOutCubic = t =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animateScroll = currentTime => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeInOutCubic(progress);
      window.scrollTo(0, startY + diff * ease);

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  const scrollToSignup = () => {
    const targetY = signupRef.current.offsetTop;
    const duration = 1000;
    const startY = window.scrollY;
    const diff = targetY - startY;
    const startTime = performance.now();

    const easeInOutCubic = t =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animateScroll = currentTime => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeInOutCubic(progress);
      window.scrollTo(0, startY + diff * ease);

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  return (
    <>
      <InitPage onSigninClick={scrollToSignin} onSignupClick={scrollToSignup} />
      <div ref={signinRef}>
        <Signin />
      </div>
      <div ref={signupRef}>
        <Signup />
      </div>
    </>
  );
}

export default App;
