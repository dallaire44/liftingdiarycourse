import { pgTable, text, uuid, timestamp, integer, decimal, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Exercises table - user-created exercise library
export const exercises = pgTable("exercises", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(), // Clerk user ID
  name: text("name").notNull(),
  category: text("category"), // optional basic categorization
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("exercises_user_id_idx").on(table.userId),
  nameIdx: index("exercises_name_idx").on(table.name),
}));

// Workouts table - workout sessions or templates
export const workouts = pgTable("workouts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(), // Clerk user ID
  name: text("name"), // optional name for the workout
  date: timestamp("date").defaultNow().notNull(),
  isTemplate: boolean("is_template").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("workouts_user_id_idx").on(table.userId),
  dateIdx: index("workouts_date_idx").on(table.date),
  isTemplateIdx: index("workouts_is_template_idx").on(table.isTemplate),
}));

// Workout exercises junction table - links exercises to workouts
export const workoutExercises = pgTable("workout_exercises", {
  id: uuid("id").defaultRandom().primaryKey(),
  workoutId: uuid("workout_id").notNull().references(() => workouts.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id").notNull().references(() => exercises.id, { onDelete: "cascade" }),
  order: integer("order").notNull(), // order of exercises in the workout
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  workoutIdIdx: index("workout_exercises_workout_id_idx").on(table.workoutId),
  exerciseIdIdx: index("workout_exercises_exercise_id_idx").on(table.exerciseId),
}));

// Sets table - individual sets with tracking data
export const sets = pgTable("sets", {
  id: uuid("id").defaultRandom().primaryKey(),
  workoutExerciseId: uuid("workout_exercise_id").notNull().references(() => workoutExercises.id, { onDelete: "cascade" }),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps").notNull(),
  weight: decimal("weight", { precision: 6, scale: 2 }), // optional weight in kg or lbs
  rir: integer("rir"), // Reps In Reserve (optional)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  workoutExerciseIdIdx: index("sets_workout_exercise_id_idx").on(table.workoutExerciseId),
}));

// Relations for better query experience
export const exercisesRelations = relations(exercises, ({ many }) => ({
  workoutExercises: many(workoutExercises),
}));

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

export const setsRelations = relations(sets, ({ one }) => ({
  workoutExercise: one(workoutExercises, {
    fields: [sets.workoutExerciseId],
    references: [workoutExercises.id],
  }),
}));
