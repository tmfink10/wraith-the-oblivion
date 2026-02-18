import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  displayName: text('display_name').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const characters = sqliteTable('characters', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  name: text('name').notNull(),
  player: text('player').notNull(),
  concept: text('concept').notNull(),
  // Store the full character JSON — simple for now, can normalize later
  data: text('data').notNull(), // JSON string of full Character object
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const campaigns = sqliteTable('campaigns', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  storytellerId: text('storyteller_id').references(() => users.id),
  description: text('description').notNull().default(''),
  inviteCode: text('invite_code').unique(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const campaignCharacters = sqliteTable('campaign_characters', {
  campaignId: text('campaign_id').references(() => campaigns.id).notNull(),
  characterId: text('character_id').references(() => characters.id).notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id').references(() => campaigns.id),
  name: text('name').notNull(),
  mode: text('mode').notNull().default('multiplayer'), // 'multiplayer' | 'solo'
  state: text('state').notNull().default('lobby'), // 'lobby' | 'active' | 'paused' | 'ended'
  gameState: text('game_state'), // JSON string of current game state
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const chatLogs = sqliteTable('chat_logs', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => sessions.id).notNull(),
  senderId: text('sender_id').notNull(),
  senderName: text('sender_name').notNull(),
  type: text('type').notNull(), // 'narrative' | 'ooc' | 'dice_roll' | 'system' | 'shadow_voice'
  content: text('content').notNull(),
  diceData: text('dice_data'), // JSON string of dice roll data
  timestamp: text('timestamp').notNull(),
});
