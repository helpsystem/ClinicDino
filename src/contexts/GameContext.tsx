import React, { createContext, useContext, useState } from 'react';
import { Clinic, Doctor } from '../types';

type GameContextType = {
  clinic: Clinic | null;
  setClinic: (c: Clinic) => void;
  selectedDoctor: Doctor | null;
  setSelectedDoctor: (d: Doctor | null) => void;
  score: number;
  setScore: (s: number) => void;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [score, setScore] = useState(0);

  return (
    <GameContext.Provider value={{ clinic, setClinic, selectedDoctor, setSelectedDoctor, score, setScore }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
}
