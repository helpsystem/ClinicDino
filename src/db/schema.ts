import { relations } from 'drizzle-orm';
import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';

export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'past_due', 'canceled', 'trialing']);
export const planEnum = pgEnum('plan', ['solo', 'group', 'enterprise']);

export const clinics = pgTable('clinics', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color').default('#0ea5e9'),
  rewardText: text('reward_text'),
  gameAssets: jsonb('game_assets').$type<{
    bgUrl?: string;
    doctorUrl?: string;
    pillUrl?: string;
    bottleUrl?: string;
    virusUrl?: string;
    syringeUrl?: string;
  }>(),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').default('trialing'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  clinicId: uuid('clinic_id').references(() => clinics.id), // Can be null if they haven't set up a clinic yet
  createdAt: timestamp('created_at').defaultNow(),
});

export const doctors = pgTable('doctors', {
  id: uuid('id').primaryKey().defaultRandom(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  title: text('title'),
  avatarUrl: text('avatar_url'),
  spriteSheetUrl: text('sprite_sheet_url'),
  isActive: boolean('is_active').default(true),
});

export const leaderboardEntries = pgTable('leaderboard_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id, { onDelete: 'cascade' }),
  doctorId: uuid('doctor_id').references(() => doctors.id, { onDelete: 'set null' }),
  playerName: text('player_name').notNull(),
  score: integer('score').notNull(),
  selfieUrl: text('selfie_url'),
  isFlagged: boolean('is_flagged').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  clinicId: uuid('clinic_id').notNull().references(() => clinics.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id'),
  plan: planEnum('plan').notNull().default('solo'),
  currentPeriodEnd: timestamp('current_period_end'),
});

// Relationships
export const clinicsRelations = relations(clinics, ({ many }) => ({
  doctors: many(doctors),
  leaderboardEntries: many(leaderboardEntries),
  subscriptions: many(subscriptions),
  users: many(users),
}));

export const usersRelations = relations(users, ({ one }) => ({
  clinic: one(clinics, {
    fields: [users.clinicId],
    references: [clinics.id],
  }),
}));

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
  clinic: one(clinics, {
    fields: [doctors.clinicId],
    references: [clinics.id],
  }),
  leaderboardEntries: many(leaderboardEntries),
}));

export const leaderboardEntriesRelations = relations(leaderboardEntries, ({ one }) => ({
  clinic: one(clinics, {
    fields: [leaderboardEntries.clinicId],
    references: [clinics.id],
  }),
  doctor: one(doctors, {
    fields: [leaderboardEntries.doctorId],
    references: [doctors.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  clinic: one(clinics, {
    fields: [subscriptions.clinicId],
    references: [clinics.id],
  }),
}));
