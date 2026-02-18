import { create } from 'zustand';
import { rollPool } from '@wraith/shared';
import type { DiceRollResult } from '@wraith/shared';

interface DiceRollEntry {
  id: string;
  result: DiceRollResult;
  label?: string;
  timestamp: number;
}

interface DiceState {
  rollHistory: DiceRollEntry[];
  isRolling: boolean;

  // Actions
  roll: (poolSize: number, difficulty: number, specialty: boolean, label?: string) => DiceRollResult;
  clearHistory: () => void;
  setRolling: (rolling: boolean) => void;
}

let rollIdCounter = 0;

export const useDiceStore = create<DiceState>((set, get) => ({
  rollHistory: [],
  isRolling: false,

  roll: (poolSize, difficulty, specialty, label) => {
    const result = rollPool(poolSize, difficulty, specialty);
    const entry: DiceRollEntry = {
      id: `roll-${++rollIdCounter}`,
      result,
      label,
      timestamp: Date.now(),
    };

    set((state) => ({
      rollHistory: [entry, ...state.rollHistory].slice(0, 20), // Keep last 20
      isRolling: false,
    }));

    return result;
  },

  clearHistory: () => set({ rollHistory: [] }),
  setRolling: (rolling) => set({ isRolling: rolling }),
}));
