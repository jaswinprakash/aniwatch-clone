// FullscreenContext.js
import React, { createContext, useState, useContext } from 'react';

const FullscreenContext = createContext({
  isFullscreenContext: false,
  setIsFullscreenContext: () => {},
});

export const FullscreenProvider = ({ children }) => {
  const [isFullscreenContext, setIsFullscreenContext] = useState(false);
  
  return (
    <FullscreenContext.Provider value={{ isFullscreenContext, setIsFullscreenContext }}>
      {children}
    </FullscreenContext.Provider>
  );
};

export const useFullscreen = () => useContext(FullscreenContext);