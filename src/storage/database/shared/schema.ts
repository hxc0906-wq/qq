import { sql } from "drizzle-orm"
import { pgTable, serial, text, varchar, timestamp, index, integer } from "drizzle-orm/pg-core"



export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const users = pgTable(
	"users",
	{
		id: serial().primaryKey(),
		username: varchar("username", { length: 50 }).notNull().unique(),
		password: varchar("password", { length: 255 }).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("users_username_idx").on(table.username),
	]
);

export const gameRecords = pgTable(
	"game_records",
	{
		id: serial().primaryKey(),
		user_id: integer("user_id").notNull(),
		scenario: varchar("scenario", { length: 100 }).notNull(),
		final_score: integer("final_score").notNull(),
		result: varchar("result", { length: 20 }).notNull(),
		played_at: timestamp("played_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("game_records_user_id_idx").on(table.user_id),
	]
);

export const blogPosts = pgTable(
	"blog_posts",
	{
		id: serial().primaryKey(),
		title: varchar("title", { length: 255 }).notNull(),
		summary: varchar("summary", { length: 500 }).notNull(),
		content: text("content").notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("blog_posts_created_at_idx").on(table.created_at),
	]
);
