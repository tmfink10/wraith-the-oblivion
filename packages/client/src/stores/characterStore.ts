import { create } from 'zustand';
import type {
  Character,
  CharacterCreationState,
  CharacterCreationStep,
  ExperienceTemplate,
  AttributeCategory,
  AbilityCategory,
  Priority,
  DotRating,
  Background,
  Passion,
  Fetter,
  BackgroundName,
  FetterType,
} from '@wraith/shared';
import type { ArcanosName, ArcanosRating } from '@wraith/shared';
import type { Shadow, ThornName } from '@wraith/shared';
import {
  createCharacterCreationState,
  getNextStep,
  getPreviousStep,
  finalizeCharacter,
  getFreebiePointCost,
} from '@wraith/shared';

interface CharacterStore {
  // Character list
  characters: Character[];
  selectedCharacterId: string | null;

  // Creation wizard
  creationState: CharacterCreationState | null;

  // Actions - Character List
  setCharacters: (characters: Character[]) => void;
  selectCharacter: (id: string | null) => void;
  addCharacter: (character: Character) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;

  // Actions - Creation Wizard
  startCreation: (template?: ExperienceTemplate) => void;
  cancelCreation: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: CharacterCreationStep) => void;

  // Actions - Concept Step
  setConceptField: (field: string, value: string) => void;

  // Actions - Attributes Step
  setAttributePriority: (category: AttributeCategory, priority: Priority) => void;
  setAttribute: (category: AttributeCategory, key: string, value: number) => void;

  // Actions - Abilities Step
  setAbilityPriority: (category: AbilityCategory, priority: Priority) => void;
  setAbility: (category: AbilityCategory, key: string, value: number) => void;

  // Actions - Advantages Step
  addBackground: (name: BackgroundName) => void;
  removeBackground: (name: BackgroundName) => void;
  setBackgroundRating: (name: BackgroundName, rating: number) => void;
  addArcanos: (name: ArcanosName) => void;
  removeArcanos: (name: ArcanosName) => void;
  setArcanosRating: (name: ArcanosName, rating: number) => void;
  addPassion: (description: string, emotion: string, rating: DotRating) => void;
  removePassion: (id: string) => void;
  setPassionRating: (id: string, rating: number) => void;
  addFetter: (description: string, type: FetterType, rating: DotRating) => void;
  removeFetter: (id: string) => void;
  setFetterRating: (id: string, rating: number) => void;

  // Actions - Shadow Step
  setShadowArchetype: (archetype: string) => void;
  addDarkPassion: (description: string, emotion: string, rating: DotRating) => void;
  removeDarkPassion: (id: string) => void;
  addThorn: (name: ThornName, rating: DotRating) => void;
  removeThorn: (name: ThornName) => void;

  // Actions - Finalize
  finishCreation: () => Character | null;
}

export const useCharacterStore = create<CharacterStore>((set, get) => ({
  characters: [],
  selectedCharacterId: null,
  creationState: null,

  // ─── Character List ───────────────────────────────────────────
  setCharacters: (characters) => set({ characters }),
  selectCharacter: (id) => set({ selectedCharacterId: id }),
  addCharacter: (character) =>
    set((state) => ({ characters: [...state.characters, character] })),
  updateCharacter: (id, updates) =>
    set((state) => ({
      characters: state.characters.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c,
      ),
    })),
  deleteCharacter: (id) =>
    set((state) => ({
      characters: state.characters.filter((c) => c.id !== id),
      selectedCharacterId: state.selectedCharacterId === id ? null : state.selectedCharacterId,
    })),

  // ─── Creation Wizard ──────────────────────────────────────────
  startCreation: (template = 'standard') =>
    set({ creationState: createCharacterCreationState(template) }),
  cancelCreation: () => set({ creationState: null }),
  nextStep: () =>
    set((state) => {
      if (!state.creationState) return state;
      const next = getNextStep(state.creationState.step);
      if (!next) return state;
      return { creationState: { ...state.creationState, step: next } };
    }),
  prevStep: () =>
    set((state) => {
      if (!state.creationState) return state;
      const prev = getPreviousStep(state.creationState.step);
      if (!prev) return state;
      return { creationState: { ...state.creationState, step: prev } };
    }),
  goToStep: (step) =>
    set((state) => {
      if (!state.creationState) return state;
      return { creationState: { ...state.creationState, step } };
    }),

  // ─── Concept ──────────────────────────────────────────────────
  setConceptField: (field, value) =>
    set((state) => {
      if (!state.creationState) return state;
      return {
        creationState: {
          ...state.creationState,
          character: { ...state.creationState.character, [field]: value },
        },
      };
    }),

  // ─── Attributes ───────────────────────────────────────────────
  setAttributePriority: (category, priority) =>
    set((state) => {
      if (!state.creationState) return state;
      return {
        creationState: {
          ...state.creationState,
          attributePriorities: {
            ...state.creationState.attributePriorities,
            [category]: priority,
          },
        },
      };
    }),
  setAttribute: (category, key, value) =>
    set((state) => {
      if (!state.creationState?.character.attributes) return state;
      const attrs = state.creationState.character.attributes;
      return {
        creationState: {
          ...state.creationState,
          character: {
            ...state.creationState.character,
            attributes: {
              ...attrs,
              [category]: { ...attrs[category], [key]: value },
            },
          },
        },
      };
    }),

  // ─── Abilities ────────────────────────────────────────────────
  setAbilityPriority: (category, priority) =>
    set((state) => {
      if (!state.creationState) return state;
      return {
        creationState: {
          ...state.creationState,
          abilityPriorities: {
            ...state.creationState.abilityPriorities,
            [category]: priority,
          },
        },
      };
    }),
  setAbility: (category, key, value) =>
    set((state) => {
      if (!state.creationState?.character.abilities) return state;
      const abils = state.creationState.character.abilities;
      return {
        creationState: {
          ...state.creationState,
          character: {
            ...state.creationState.character,
            abilities: {
              ...abils,
              [category]: { ...abils[category], [key]: value },
            },
          },
        },
      };
    }),

  // ─── Backgrounds ──────────────────────────────────────────────
  addBackground: (name) =>
    set((state) => {
      if (!state.creationState) return state;
      const bgs = state.creationState.character.backgrounds || [];
      if (bgs.find((b) => b.name === name)) return state;
      return {
        creationState: {
          ...state.creationState,
          character: {
            ...state.creationState.character,
            backgrounds: [...bgs, { name, rating: 1 as DotRating }],
          },
        },
      };
    }),
  removeBackground: (name) =>
    set((state) => {
      if (!state.creationState) return state;
      return {
        creationState: {
          ...state.creationState,
          character: {
            ...state.creationState.character,
            backgrounds: (state.creationState.character.backgrounds || []).filter(
              (b) => b.name !== name,
            ),
          },
        },
      };
    }),
  setBackgroundRating: (name, rating) =>
    set((state) => {
      if (!state.creationState) return state;
      return {
        creationState: {
          ...state.creationState,
          character: {
            ...state.creationState.character,
            backgrounds: (state.creationState.character.backgrounds || []).map((b) =>
              b.name === name ? { ...b, rating: rating as DotRating } : b,
            ),
          },
        },
      };
    }),

  // ─── Arcanoi ──────────────────────────────────────────────────
  addArcanos: (name) =>
    set((state) => {
      if (!state.creationState) return state;
      const arcs = state.creationState.character.arcanoi || [];
      if (arcs.find((a) => a.name === name)) return state;
      return {
        creationState: {
          ...state.creationState,
          character: {
            ...state.creationState.character,
            arcanoi: [...arcs, { name, rating: 1 as DotRating }],
          },
        },
      };
    }),
  removeArcanos: (name) =>
    set((state) => {
      if (!state.creationState) return state;
      return {
        creationState: {
          ...state.creationState,
          character: {
            ...state.creationState.character,
            arcanoi: (state.creationState.character.arcanoi || []).filter(
              (a) => a.name !== name,
            ),
          },
        },
      };
    }),
  setArcanosRating: (name, rating) =>
    set((state) => {
      if (!state.creationState) return state;
      return {
        creationState: {
          ...state.creationState,
          character: {
            ...state.creationState.character,
            arcanoi: (state.creationState.character.arcanoi || []).map((a) =>
              a.name === name ? { ...a, rating: rating as DotRating } : a,
            ),
          },
        },
      };
    }),

  // ─── Passions ─────────────────────────────────────────────────
  addPassion: (description, emotion, rating) =>
    set((state) => {
      if (!state.creationState) return state;
      const id = crypto.randomUUID();
      const passions = state.creationState.character.passions || [];
      return {
        creationState: {
          ...state.creationState,
          character: {
            ...state.creationState.character,
            passions: [...passions, { id, description, emotion, rating }],
          },
        },
      };
    }),
  removePassion: (id) =>
    set((state) => {
      if (!state.creationState) return state;
      return {
        creationState: {
          ...state.creationState,
          character: {
            ...state.creationState.character,
            passions: (state.creationState.character.passions || []).filter((p) => p.id !== id),
          },
        },
      };
    }),
  setPassionRating: (id, rating) =>
    set((state) => {
      if (!state.creationState) return state;
      return {
        creationState: {
          ...state.creationState,
          character: {
            ...state.creationState.character,
            passions: (state.creationState.character.passions || []).map((p) =>
              p.id === id ? { ...p, rating: rating as DotRating } : p,
            ),
          },
        },
      };
    }),

  // ─── Fetters ──────────────────────────────────────────────────
  addFetter: (description, type, rating) =>
    set((state) => {
      if (!state.creationState) return state;
      const id = crypto.randomUUID();
      const fetters = state.creationState.character.fetters || [];
      return {
        creationState: {
          ...state.creationState,
          character: {
            ...state.creationState.character,
            fetters: [...fetters, { id, description, type, rating }],
          },
        },
      };
    }),
  removeFetter: (id) =>
    set((state) => {
      if (!state.creationState) return state;
      return {
        creationState: {
          ...state.creationState,
          character: {
            ...state.creationState.character,
            fetters: (state.creationState.character.fetters || []).filter((f) => f.id !== id),
          },
        },
      };
    }),
  setFetterRating: (id, rating) =>
    set((state) => {
      if (!state.creationState) return state;
      return {
        creationState: {
          ...state.creationState,
          character: {
            ...state.creationState.character,
            fetters: (state.creationState.character.fetters || []).map((f) =>
              f.id === id ? { ...f, rating: rating as DotRating } : f,
            ),
          },
        },
      };
    }),

  // ─── Shadow ───────────────────────────────────────────────────
  setShadowArchetype: (archetype) =>
    set((state) => {
      if (!state.creationState?.character.shadow) return state;
      return {
        creationState: {
          ...state.creationState,
          character: {
            ...state.creationState.character,
            shadow: { ...state.creationState.character.shadow!, archetype },
          },
        },
      };
    }),
  addDarkPassion: (description, emotion, rating) =>
    set((state) => {
      if (!state.creationState?.character.shadow) return state;
      const id = crypto.randomUUID();
      const shadow = state.creationState.character.shadow!;
      return {
        creationState: {
          ...state.creationState,
          character: {
            ...state.creationState.character,
            shadow: {
              ...shadow,
              darkPassions: [...shadow.darkPassions, { id, description, emotion, rating }],
            },
          },
        },
      };
    }),
  removeDarkPassion: (id) =>
    set((state) => {
      if (!state.creationState?.character.shadow) return state;
      const shadow = state.creationState.character.shadow!;
      return {
        creationState: {
          ...state.creationState,
          character: {
            ...state.creationState.character,
            shadow: {
              ...shadow,
              darkPassions: shadow.darkPassions.filter((dp) => dp.id !== id),
            },
          },
        },
      };
    }),
  addThorn: (name, rating) =>
    set((state) => {
      if (!state.creationState?.character.shadow) return state;
      const shadow = state.creationState.character.shadow!;
      if (shadow.thorns.some((t) => t.name === name)) return state;
      return {
        creationState: {
          ...state.creationState,
          character: {
            ...state.creationState.character,
            shadow: {
              ...shadow,
              thorns: [...shadow.thorns, { name, rating }],
            },
          },
        },
      };
    }),
  removeThorn: (name) =>
    set((state) => {
      if (!state.creationState?.character.shadow) return state;
      const shadow = state.creationState.character.shadow!;
      return {
        creationState: {
          ...state.creationState,
          character: {
            ...state.creationState.character,
            shadow: {
              ...shadow,
              thorns: shadow.thorns.filter((t) => t.name !== name),
            },
          },
        },
      };
    }),

  // ─── Finalize ─────────────────────────────────────────────────
  finishCreation: () => {
    const state = get().creationState;
    if (!state) return null;
    const character = finalizeCharacter(state);
    set((s) => ({
      characters: [...s.characters, character],
      creationState: null,
      selectedCharacterId: character.id,
    }));
    return character;
  },
}));
