'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type SavedItem = {
  productId: string;
  savedAt: string; // ISO8601
};

type SavedItemsContextValue = {
  savedItems: SavedItem[];
  isSaved: (productId: string) => boolean;
  toggleSaved: (productId: string) => { saved: boolean };
  savedCount: number;
};

const STORAGE_KEY = 'earbudsDbSavedProductIds';
const SAVE_LIMIT = 100;

const SavedItemsContext = createContext<SavedItemsContextValue | undefined>(undefined);

function readFromStorage(): SavedItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(x => x && typeof x.productId === 'string')
      .sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''))
      .slice(0, SAVE_LIMIT);
  } catch {
    return [];
  }
}

function writeToStorage(items: SavedItem[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function SavedItemsProvider({ children }: { children: React.ReactNode }) {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const initRef = useRef(false);

  // 初期読み込み
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    setSavedItems(readFromStorage());
  }, []);

  // storageイベントで他タブと同期
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setSavedItems(readFromStorage());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // 変更を保存
  useEffect(() => {
    writeToStorage(savedItems);
  }, [savedItems]);

  const isSaved = useCallback((productId: string) => {
    return savedItems.some(x => x.productId === productId);
  }, [savedItems]);

  const toggleSaved = useCallback((productId: string) => {
    let saved = false;
    setSavedItems(prev => {
      const exists = prev.some(x => x.productId === productId);
      if (exists) {
        saved = false;
        return prev.filter(x => x.productId !== productId);
      } else {
        saved = true;
        const next: SavedItem = { productId, savedAt: new Date().toISOString() };
        const merged = [next, ...prev.filter(x => x.productId !== productId)]
          .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
          .slice(0, SAVE_LIMIT);
        return merged;
      }
    });
    return { saved };
  }, []);

  const value = useMemo(() => ({
    savedItems,
    isSaved,
    toggleSaved,
    savedCount: savedItems.length,
  }), [savedItems, isSaved, toggleSaved]);

  return (
    <SavedItemsContext.Provider value={value}>
      {children}
    </SavedItemsContext.Provider>
  );
}

export function useSavedItems() {
  const ctx = useContext(SavedItemsContext);
  if (!ctx) throw new Error('useSavedItems must be used within SavedItemsProvider');
  return ctx;
}


