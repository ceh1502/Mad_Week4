import React, { useRef } from 'react';
import InitPage from './pages/InitPage.jsx';
import Signin from './pages/Signin.jsx';
import './App.css';


function App() {
  const scrollToSignin = () => {
  const targetY = signinRef.current.offsetTop;
  const duration = 1000; // 원하는 스크롤 속도 (밀리초 단위, 1000 = 1초)
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

  const signinRef = useRef(null);

  return (
    <>
      <InitPage onSigninClick={scrollToSignin} />
      <div ref={signinRef}>
        <Signin />
      </div>
    </>
  );
}

export default App;
