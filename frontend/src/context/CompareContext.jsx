import { createContext, useContext, useState, useCallback } from 'react';

const CompareContext = createContext(null);

const MAX_COMPARE = 4;

export function CompareProvider({ children }) {
  const [compareList, setCompareList] = useState([]); // array of full property objects

  const addToCompare = useCallback((property) => {
    setCompareList(prev => {
      if (prev.find(p => p.id === property.id)) return prev;
      if (prev.length >= MAX_COMPARE) return prev; // silently cap at 4
      return [...prev, property];
    });
  }, []);

  const removeFromCompare = useCallback((id) => {
    setCompareList(prev => prev.filter(p => p.id !== id));
  }, []);

  const isInCompare = useCallback((id) => {
    return compareList.some(p => p.id === id);
  }, [compareList]);

  const clearCompare = useCallback(() => setCompareList([]), []);

  const canAdd = compareList.length < MAX_COMPARE;

  return (
    <CompareContext.Provider value={{
      compareList,
      addToCompare,
      removeFromCompare,
      isInCompare,
      clearCompare,
      canAdd,
      count: compareList.length,
      MAX_COMPARE,
    }}>
      {children}
    </CompareContext.Provider>
  );
}

export const useCompare = () => useContext(CompareContext);
