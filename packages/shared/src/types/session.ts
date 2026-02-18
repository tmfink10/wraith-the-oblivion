import type { CombatState } from './combat.js';

export interface GameSession {
  id: string;
  name: string;
  campaignId: string;
  storytellerId: string;
  mode: SessionMode;
  state: SessionState;
  players: SessionPlayer[];
  chatLog: ChatMessage[];
  combat: CombatState | null;
  createdAt: string;
  updatedAt: string;
}

export type SessionMode = 'multiplayer' | 'solo';
export type SessionState = 'lobby' | 'active' | 'paused' | 'ended';

export interface SessionPlayer {
  userId: string;
  characterId: string;
  displayName: string;
  isStoryteller: boolean;
  isConnected: boolean;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  type: ChatMessageType;
  content: string;
  timestamp: string;
  diceRoll?: {
    dice: number[];
    successes: number;
    difficulty: number;
    isBotch: boolean;
  };
}

export type ChatMessageType = 'narrative' | 'ooc' | 'dice_roll' | 'system' | 'shadow_voice';

export interface Campaign {
  id: string;
  name: string;
  storytellerId: string;
  description: string;
  inviteCode?: string;
  sessions: string[];
  characterIds: string[];
  createdAt: string;
  updatedAt: string;
}
