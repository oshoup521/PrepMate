import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';

const ConfettiEffect = ({ duration = 5000 }) => {
  const [dimensions, setDimensions] = useState({ 
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [isActive, setIsActive] = useState(true);
  
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    
    // Turn off confetti after duration
    const timeout = setTimeout(() => {
      setIsActive(false);
    }, duration);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, [duration]);

  if (!isActive) return null;
  
  return (
    <Confetti
      width={dimensions.width}
      height={dimensions.height}
      recycle={false}
      numberOfPieces={200}
      tweenDuration={10000}
      colors={['#3b82f6', '#6366f1', '#4f46e5', '#8b5cf6', '#a855f7', '#60a5fa', '#93c5fd']}
    />
  );
};

export default ConfettiEffect;
