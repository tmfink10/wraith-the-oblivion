import type { GameSession, SessionState, SessionPlayer, ChatMessage, ChatMessageType, Campaign } from './session.js';
import type { CombatState, InitiativeEntry } from './combat.js';

// ─── Identity (pre-auth lightweight) ────────────────────────────

export interface PlayerIdentity {
  /** UUID, generated once, persisted in localStorage */
  clientId: string;
  /** Display name chosen by the player */
  displayName: string;
}

// ─── Room / Session Management ──────────────────────────────────

export interface CreateSessionPayload {
  name: string;
  campaignId?: string;
  storytellerIdentity: PlayerIdentity;
}

export interface CreateSessionResponse {
  sessionId: string;
  session: GameSession;
}

export interface JoinSessionPayload {
  sessionId: string;
  identity: PlayerIdentity;
  characterId?: string;
}

export interface JoinSessionResponse {
  success: boolean;
  session: GameSession;
  error?: string;
}

export interface LeaveSessionPayload {
  sessionId: string;
}

export interface SessionListItem {
  id: string;
  name: string;
  storytellerName: string;
  playerCount: number;
  state: SessionState;
  campaignId?: string;
}

export interface SelectCharacterPayload {
  sessionId: string;
  characterId: string;
}

export interface UpdateSessionStatePayload {
  sessionId: string;
  newState: SessionState;
}

export interface SaveGameStatePayload {
  sessionId: string;
}

// ─── Chat ───────────────────────────────────────────────────────

export interface SendChatPayload {
  sessionId: string;
  type: ChatMessageType;
  content: string;
}

// ─── Dice ───────────────────────────────────────────────────────

export interface DiceRollPayload {
  sessionId: string;
  poolSize: number;
  difficulty: number;
  isSpecialty: boolean;
  label?: string;
  isPrivate?: boolean;
}

export interface DiceRollBroadcast {
  message: ChatMessage;
  rollerId: string;
  rollerName: string;
}

// ─── Initiative / Combat ────────────────────────────────────────

export interface StartCombatPayload {
  sessionId: string;
}

export interface RollInitiativePayload {
  sessionId: string;
  characterId: string;
  dexterity: number;
  wits: number;
}

export interface AdvanceTurnPayload {
  sessionId: string;
}

export interface EndCombatPayload {
  sessionId: string;
}

// ─── Game Map ───────────────────────────────────────────────────

export interface MapToken {
  id: string;
  characterId?: string;
  label: string;
  x: number;
  y: number;
  color: string;
  /** Grid cells, default 1 */
  size: number;
  /** Fog of war: visible to players? */
  isVisible: boolean;
}

export interface MapState {
  backgroundUrl: string | null;
  /** Pixels per cell */
  gridSize: number;
  /** Grid width in cells */
  width: number;
  /** Grid height in cells */
  height: number;
  tokens: MapToken[];
  /** [row][col] — true = visible, false = hidden */
  fogOfWar: boolean[][];
  panX: number;
  panY: number;
  zoom: number;
}

export interface MoveTokenPayload {
  sessionId: string;
  tokenId: string;
  x: number;
  y: number;
}

export interface AddTokenPayload {
  sessionId: string;
  token: Omit<MapToken, 'id'>;
}

export interface RemoveTokenPayload {
  sessionId: string;
  tokenId: string;
}

export interface UpdateFogPayload {
  sessionId: string;
  cells: Array<{ row: number; col: number; visible: boolean }>;
}

export interface SetMapBackgroundPayload {
  sessionId: string;
  backgroundUrl: string;
  gridSize: number;
  width: number;
  height: number;
}

// ─── Socket Event Name Constants ────────────────────────────────

export const ClientEvents = {
  // Room
  CREATE_SESSION: 'session:create',
  JOIN_SESSION: 'session:join',
  LEAVE_SESSION: 'session:leave',
  LIST_SESSIONS: 'session:list',
  SELECT_CHARACTER: 'session:selectCharacter',
  UPDATE_STATE: 'session:updateState',
  SAVE_GAME: 'session:save',

  // Chat
  SEND_CHAT: 'chat:send',

  // Dice
  ROLL_DICE: 'dice:roll',

  // Combat / Initiative
  START_COMBAT: 'combat:start',
  ROLL_INITIATIVE: 'combat:rollInitiative',
  ADVANCE_TURN: 'combat:advanceTurn',
  END_COMBAT: 'combat:end',

  // Map
  MOVE_TOKEN: 'map:moveToken',
  ADD_TOKEN: 'map:addToken',
  REMOVE_TOKEN: 'map:removeToken',
  UPDATE_FOG: 'map:updateFog',
  SET_MAP_BG: 'map:setBackground',
} as const;

export const ServerEvents = {
  // Room
  SESSION_CREATED: 'session:created',
  SESSION_JOINED: 'session:joined',
  SESSION_LEFT: 'session:left',
  SESSION_LIST: 'session:list',
  SESSION_UPDATED: 'session:updated',
  PLAYER_JOINED: 'session:playerJoined',
  PLAYER_LEFT: 'session:playerLeft',
  PLAYER_RECONNECTED: 'session:playerReconnected',
  SESSION_STATE_CHANGED: 'session:stateChanged',
  GAME_SAVED: 'session:gameSaved',

  // Chat
  CHAT_MESSAGE: 'chat:message',
  CHAT_HISTORY: 'chat:history',

  // Dice
  DICE_RESULT: 'dice:result',

  // Combat / Initiative
  COMBAT_STARTED: 'combat:started',
  INITIATIVE_ROLLED: 'combat:initiativeRolled',
  INITIATIVE_ORDER_SET: 'combat:orderSet',
  TURN_ADVANCED: 'combat:turnAdvanced',
  COMBAT_ENDED: 'combat:ended',

  // Map
  TOKEN_MOVED: 'map:tokenMoved',
  TOKEN_ADDED: 'map:tokenAdded',
  TOKEN_REMOVED: 'map:tokenRemoved',
  FOG_UPDATED: 'map:fogUpdated',
  MAP_BG_SET: 'map:backgroundSet',

  // Errors
  ERROR: 'error',
} as const;
