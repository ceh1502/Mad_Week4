import React, { createContext, useContext, useState } from 'react';

const FlirtoContext = createContext();

export const FlirtoProvider = ({ children }) => {
  const [isFlirtoOn, setIsFlirtoOn] = useState(false);

  return (
    <FlirtoContext.Provider value={{ isFlirtoOn, setIsFlirtoOn }}>
      {children}
    </FlirtoContext.Provider>
  );
};

export const useFlirto = () => useContext(FlirtoContext);
