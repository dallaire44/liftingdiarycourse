import { pgTable, text, integer, timestamp, real, index, serial, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// EXERCISES TABLE - Reusable Exercise Catalog
// ============================================================================

export const exercises = pgTable('exercises', {
  id: serial('id').primaryKey(),

  // Exercise details
  name: text('name').notNull(),

  // User ownership (null = global/system exercise, userId = user-created)
  userId: text('user_id'), // Clerk user ID - null for global exercises

  // Whether this is a compound/isolation movement
  isCompound: integer('is_compound').notNull().default(0), // 0=isolation, 1=compound

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Index for finding user's exercises + global exercises
  userIdIdx: index('exercises_user_id_idx').on(table.userId),

  // Unique constraint: same user can't have duplicate exercise names
  // Global exercises (userId=null) can have same names as user exercises
  userExerciseNameIdx: uniqueIndex('user_exercise_name_idx')
    .on(table.userId, table.name),
}));

// ============================================================================
// WORKOUTS TABLE - Workout Sessions
// ============================================================================

export const workouts = pgTable('workouts', {
  id: serial('id').primaryKey(),

  // User who performed the workout
  userId: text('user_id').notNull(), // Clerk user ID

  // Workout metadata
  name: text('name'), // Optional name like "Leg Day" or "Morning Session"

  // Timing
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'), // Null if workout is in progress

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Index for user's workouts ordered by date
  userIdStartedAtIdx: index('workouts_user_id_started_at_idx')
    .on(table.userId, table.startedAt),

  // Index for finding incomplete workouts
  userIdCompletedAtIdx: index('workouts_user_id_completed_at_idx')
    .on(table.userId, table.completedAt),
}));

// ============================================================================
// WORKOUT_EXERCISES TABLE - Exercises performed in a workout
// ============================================================================

export const workoutExercises = pgTable('workout_exercises', {
  id: serial('id').primaryKey(),

  // Foreign keys
  workoutId: integer('workout_id')
    .notNull()
    .references(() => workouts.id, { onDelete: 'cascade' }),
  exerciseId: integer('exercise_id')
    .notNull()
    .references(() => exercises.id, { onDelete: 'restrict' }), // Don't delete exercise if used in workouts

  // Order within the workout (for displaying exercises in order)
  order: integer('order').notNull().default(0),

  // Target metrics (optional - what user planned to do)
  targetSets: integer('target_sets'),
  targetReps: integer('target_reps'),
  targetWeight: real('target_weight'), // in kg or lbs (app handles unit conversion)

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  // Index for finding exercises in a workout
  workoutIdOrderIdx: index('workout_exercises_workout_id_order_idx')
    .on(table.workoutId, table.order),

  // Index for finding all times an exercise was performed
  exerciseIdIdx: index('workout_exercises_exercise_id_idx')
    .on(table.exerciseId),
}));

// ============================================================================
// SETS TABLE - Individual sets within a workout exercise
// ============================================================================

export const sets = pgTable('sets', {
  id: serial('id').primaryKey(),

  // Foreign key
  workoutExerciseId: integer('workout_exercise_id')
    .notNull()
    .references(() => workoutExercises.id, { onDelete: 'cascade' }),

  // Set order (1st set, 2nd set, etc.)
  setNumber: integer('set_number').notNull(),

  // Performance metrics
  reps: integer('reps').notNull(),
  weight: real('weight'), // Nullable for bodyweight exercises

  // Advanced metrics (all optional)
  rir: integer('rir'), // Reps In Reserve (0-5 typically)
  tempo: text('tempo'), // e.g., "3-1-1-0" (eccentric-pause-concentric-pause)

  // Set type flags
  isWarmup: integer('is_warmup').notNull().default(0), // 0=working set, 1=warmup
  isDropSet: integer('is_dropset').notNull().default(0), // 0=normal, 1=drop set
  isFailure: integer('is_failure').notNull().default(0), // 0=not to failure, 1=to failure

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'), // When this set was completed
}, (table) => ({
  // Index for finding sets for a workout exercise
  workoutExerciseIdSetNumberIdx: index('sets_workout_exercise_id_set_number_idx')
    .on(table.workoutExerciseId, table.setNumber),
}));

// ============================================================================
// RELATIONS (for Drizzle relational queries)
// ============================================================================

export const workoutsRelations = relations(workouts, ({ many }) => ({
  workoutExercises: many(workoutExercises),
}));

export const workoutExercisesRelations = relations(workoutExercises, ({ one, many }) => ({
  workout: one(workouts, {
    fields: [workoutExercises.workoutId],
    references: [workouts.id],
  }),
  exercise: one(exercises, {
    fields: [workoutExercises.exerciseId],
    references: [exercises.id],
  }),
  sets: many(sets),
}));

export const exercisesRelations = relations(exercises, ({ many }) => ({
  workoutExercises: many(workoutExercises),
}));

export const setsRelations = relations(sets, ({ one }) => ({
  workoutExercise: one(workoutExercises, {
    fields: [sets.workoutExerciseId],
    references: [workoutExercises.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS (for TypeScript)
// ============================================================================

export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;

export type Workout = typeof workouts.$inferSelect;
export type NewWorkout = typeof workouts.$inferInsert;

export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type NewWorkoutExercise = typeof workoutExercises.$inferInsert;

export type Set = typeof sets.$inferSelect;
export type NewSet = typeof sets.$inferInsert;
