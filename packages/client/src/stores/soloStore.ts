import { create } from 'zustand';
import type {
  Character,
  SoloSession,
  Scene,
  SceneEvent,
  SceneEventType,
  SoloGoal,
  ShadowDiceOffer,
  BinaryRollResult,
  OblivionDieResult,
} from '@wraith/shared';
import {
  performBinaryRoll,
  describeBinaryOutcome,
  generateScene,
  checkForRandomScene,
  generateNpc,
  describeNpcPowerLevel,
  determineShadowInterjection,
  resolveShadowDiceOffer,
} from '@wraith/shared';
import type {
  BinaryRollWithOblivionResult,
  SceneGenerationResult,
  RandomSceneCheckResult,
  GeneratedNpc,
  ShadowInterjection,
} from '@wraith/shared';

// ─── Types ────────────────────────────────────────────────────────

export type SoloPhase =
  | 'idle'
  | 'goal_setup'
  | 'scene_generate'
  | 'scene_active'
  | 'scene_end_check';

interface SoloState {
  // Session state
  phase: SoloPhase;
  session: SoloSession | null;
  character: Character | null;

  // Scene generation
  pendingScene: SceneGenerationResult | null;

  // Random scene check
  randomSceneCheck: RandomSceneCheckResult | null;

  // Shadow interjection overlay
  shadowInterjection: ShadowInterjection | null;
  pendingDiceOffer: Omit<ShadowDiceOffer, 'accepted'> | null;

  // Latest roll results (for UI display)
  latestBinaryRoll: BinaryRollWithOblivionResult | null;
  latestNpc: GeneratedNpc | null;

  // Roll/event history for current scene
  eventLog: SceneEvent[];

  // ─── Session Actions ───────────────────────────────────────────
  startSession: (character: Character) => void;
  endSession: () => void;

  // ─── Goal Actions ──────────────────────────────────────────────
  addGoal: (description: string) => void;
  removeGoal: (id: string) => void;
  updateGoalProgress: (id: string, progress: number) => void;
  completeGoal: (id: string) => void;
  finishGoalSetup: () => void;

  // ─── Scene Actions ─────────────────────────────────────────────
  generateNewScene: () => void;
  startCustomScene: (activity: string, focus: string) => void;
  acceptGeneratedScene: () => void;
  endScene: () => void;
  acceptRandomScene: () => void;
  dismissRandomScene: () => void;

  // ─── Oracle Actions ────────────────────────────────────────────
  rollBinary: (label?: string) => BinaryRollWithOblivionResult;
  rollForNpc: () => GeneratedNpc;
  addNarrativeEvent: (description: string) => void;

  // ─── Shadow Actions ────────────────────────────────────────────
  dismissShadowInterjection: () => void;
  acceptShadowDiceOffer: () => void;
  rejectShadowDiceOffer: () => void;

  // ─── Manual Adjustments ────────────────────────────────────────
  adjustTemporaryAngst: (delta: number) => void;
  adjustTemporaryShadowPoints: (delta: number) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────

let eventIdCounter = 0;
let sceneIdCounter = 0;
let goalIdCounter = 0;

function createEventId(): string {
  return `evt-${++eventIdCounter}`;
}

function createSceneId(): string {
  return `scene-${++sceneIdCounter}`;
}

function createGoalId(): string {
  return `goal-${++goalIdCounter}`;
}

function createSceneEvent(
  type: SceneEventType,
  description: string,
  binaryRoll?: BinaryRollResult,
  oblivionDie?: OblivionDieResult,
): SceneEvent {
  return {
    id: createEventId(),
    type,
    description,
    binaryRoll,
    oblivionDie,
    timestamp: new Date().toISOString(),
  };
}

function createScene(
  number: number,
  activity: string,
  focus: string,
  isRandom: boolean,
): Scene {
  return {
    id: createSceneId(),
    number,
    activity,
    focus,
    description: `${activity} ${focus}`,
    events: [],
    isRandom,
  };
}

// ─── Store ────────────────────────────────────────────────────────

export const useSoloStore = create<SoloState>((set, get) => ({
  // Initial state
  phase: 'idle',
  session: null,
  character: null,
  pendingScene: null,
  randomSceneCheck: null,
  shadowInterjection: null,
  pendingDiceOffer: null,
  latestBinaryRoll: null,
  latestNpc: null,
  eventLog: [],

  // ─── Session ───────────────────────────────────────────────────

  startSession: (character) => {
    const session: SoloSession = {
      id: crypto.randomUUID(),
      characterId: character.id,
      currentScene: createScene(0, '', '', false),
      sceneHistory: [],
      temporaryAngst: 0,
      temporaryShadowPoints: 0,
      goals: [],
    };
    set({
      phase: 'goal_setup',
      session,
      character,
      pendingScene: null,
      randomSceneCheck: null,
      shadowInterjection: null,
      pendingDiceOffer: null,
      latestBinaryRoll: null,
      latestNpc: null,
      eventLog: [],
    });
  },

  endSession: () => {
    set({
      phase: 'idle',
      session: null,
      character: null,
      pendingScene: null,
      randomSceneCheck: null,
      shadowInterjection: null,
      pendingDiceOffer: null,
      latestBinaryRoll: null,
      latestNpc: null,
      eventLog: [],
    });
  },

  // ─── Goals ─────────────────────────────────────────────────────

  addGoal: (description) =>
    set((state) => {
      if (!state.session) return state;
      const goal: SoloGoal = {
        id: createGoalId(),
        description,
        progress: 0,
        isComplete: false,
      };
      return {
        session: {
          ...state.session,
          goals: [...state.session.goals, goal],
        },
      };
    }),

  removeGoal: (id) =>
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          goals: state.session.goals.filter((g) => g.id !== id),
        },
      };
    }),

  updateGoalProgress: (id, progress) =>
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          goals: state.session.goals.map((g) =>
            g.id === id ? { ...g, progress: Math.max(0, Math.min(10, progress)) } : g,
          ),
        },
      };
    }),

  completeGoal: (id) =>
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          goals: state.session.goals.map((g) =>
            g.id === id ? { ...g, isComplete: true, progress: 10 } : g,
          ),
        },
      };
    }),

  finishGoalSetup: () =>
    set({ phase: 'scene_generate' }),

  // ─── Scenes ────────────────────────────────────────────────────

  generateNewScene: () => {
    const state = get();
    if (!state.session || !state.character) return;

    const sceneResult = generateScene();
    set({ pendingScene: sceneResult });

    // Check if Oblivion Die triggers Shadow
    if (sceneResult.oblivionDie.shadowInterjects && state.character.shadow) {
      const interjection = determineShadowInterjection(
        state.character.shadow,
        sceneResult.oblivionDie.value,
      );
      set({
        shadowInterjection: interjection,
        pendingDiceOffer: interjection.diceOffer ?? null,
      });
    }
  },

  acceptGeneratedScene: () =>
    set((state) => {
      if (!state.session || !state.pendingScene) return state;
      const sceneNumber = state.session.sceneHistory.length + 1;
      const scene = createScene(
        sceneNumber,
        state.pendingScene.activity,
        state.pendingScene.focus,
        false,
      );
      return {
        phase: 'scene_active',
        session: {
          ...state.session,
          currentScene: scene,
        },
        pendingScene: null,
        eventLog: [],
      };
    }),

  startCustomScene: (activity, focus) =>
    set((state) => {
      if (!state.session) return state;
      const sceneNumber = state.session.sceneHistory.length + 1;
      const scene = createScene(sceneNumber, activity, focus, false);
      return {
        phase: 'scene_active',
        session: {
          ...state.session,
          currentScene: scene,
        },
        pendingScene: null,
        eventLog: [],
      };
    }),

  endScene: () => {
    const state = get();
    if (!state.session) return;

    // Archive current scene
    const updatedSession = {
      ...state.session,
      sceneHistory: [...state.session.sceneHistory, {
        ...state.session.currentScene,
        events: [...state.eventLog],
      }],
    };

    // Perform random scene check
    const check = checkForRandomScene(state.session.temporaryAngst);

    if (check.triggered && check.scene) {
      set({
        phase: 'scene_end_check',
        session: updatedSession,
        randomSceneCheck: check,
      });
    } else {
      set({
        phase: 'scene_generate',
        session: updatedSession,
        randomSceneCheck: null,
        eventLog: [],
      });
    }
  },

  acceptRandomScene: () =>
    set((state) => {
      if (!state.session || !state.randomSceneCheck?.scene) return state;
      const sceneNumber = state.session.sceneHistory.length + 1;
      const scene = createScene(
        sceneNumber,
        state.randomSceneCheck.scene.type.replace(/_/g, ' '),
        state.randomSceneCheck.scene.label,
        true,
      );
      return {
        phase: 'scene_active',
        session: {
          ...state.session,
          currentScene: scene,
        },
        randomSceneCheck: null,
        eventLog: [],
      };
    }),

  dismissRandomScene: () =>
    set({
      phase: 'scene_generate',
      randomSceneCheck: null,
      eventLog: [],
    }),

  // ─── Oracle ────────────────────────────────────────────────────

  rollBinary: (label) => {
    const state = get();
    const result = performBinaryRoll();
    const outcomeLabel = describeBinaryOutcome(
      result.binaryRoll.outcome,
      result.isDoubleTie,
    );
    const description = label
      ? `${label}: ${outcomeLabel} (${result.binaryRoll.positiveDie}+ vs ${result.binaryRoll.negativeDie}-)`
      : `Binary Roll: ${outcomeLabel} (${result.binaryRoll.positiveDie}+ vs ${result.binaryRoll.negativeDie}-)`;

    const event = createSceneEvent(
      'binary_roll',
      description,
      result.binaryRoll,
      result.oblivionDie,
    );

    set((s) => ({
      latestBinaryRoll: result,
      eventLog: [...s.eventLog, event],
    }));

    // Check Shadow interjection
    if (result.oblivionDie.shadowInterjects && state.character?.shadow) {
      const interjection = determineShadowInterjection(
        state.character.shadow,
        result.oblivionDie.value,
      );
      const shadowEvent = createSceneEvent(
        'shadow_interjection',
        interjection.description,
        undefined,
        result.oblivionDie,
      );
      set((s) => ({
        shadowInterjection: interjection,
        pendingDiceOffer: interjection.diceOffer ?? null,
        eventLog: [...s.eventLog, shadowEvent],
      }));
    }

    return result;
  },

  rollForNpc: () => {
    const npc = generateNpc();
    const description = `NPC Generated: ${describeNpcPowerLevel(npc.powerLevel.level)} — ${npc.descriptor}, motivated by ${npc.motivation}`;
    const event = createSceneEvent('narrative', description);

    set((s) => ({
      latestNpc: npc,
      eventLog: [...s.eventLog, event],
    }));

    return npc;
  },

  addNarrativeEvent: (description) => {
    const event = createSceneEvent('narrative', description);
    set((s) => ({
      eventLog: [...s.eventLog, event],
    }));
  },

  // ─── Shadow ────────────────────────────────────────────────────

  dismissShadowInterjection: () =>
    set({
      shadowInterjection: null,
      pendingDiceOffer: null,
    }),

  acceptShadowDiceOffer: () =>
    set((state) => {
      if (!state.session || !state.pendingDiceOffer) return state;
      const result = resolveShadowDiceOffer(
        state.pendingDiceOffer,
        true,
        state.session.temporaryAngst,
      );
      const event = createSceneEvent(
        'shadow_interjection',
        `Accepted Shadow's offer: +${result.bonusDice} bonus dice. Temporary Angst increases to ${result.newTemporaryAngst}.`,
      );
      return {
        session: {
          ...state.session,
          temporaryAngst: result.newTemporaryAngst,
          temporaryShadowPoints:
            state.session.temporaryShadowPoints + result.shadowPointsGained,
        },
        shadowInterjection: null,
        pendingDiceOffer: null,
        eventLog: [...state.eventLog, event],
      };
    }),

  rejectShadowDiceOffer: () =>
    set((state) => {
      const event = createSceneEvent(
        'shadow_interjection',
        'Rejected the Shadow\'s offer of bonus dice.',
      );
      return {
        shadowInterjection: null,
        pendingDiceOffer: null,
        eventLog: [...state.eventLog, event],
      };
    }),

  // ─── Manual Adjustments ────────────────────────────────────────

  adjustTemporaryAngst: (delta) =>
    set((state) => {
      if (!state.session) return state;
      const newAngst = Math.max(0, state.session.temporaryAngst + delta);
      return {
        session: {
          ...state.session,
          temporaryAngst: newAngst,
        },
      };
    }),

  adjustTemporaryShadowPoints: (delta) =>
    set((state) => {
      if (!state.session) return state;
      const newPts = Math.max(0, state.session.temporaryShadowPoints + delta);
      return {
        session: {
          ...state.session,
          temporaryShadowPoints: newPts,
        },
      };
    }),
}));
