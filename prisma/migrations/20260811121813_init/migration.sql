-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('super_admin', 'admin', 'viewer');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('draft', 'published', 'live', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('invited', 'confirmed', 'dropped');

-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('draft', 'live', 'completed', 'locked');

-- CreateEnum
CREATE TYPE "StageType" AS ENUM ('group', 'playoff', 'tiebreaker');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('scheduled', 'live', 'completed', 'disputed', 'cancelled');

-- CreateEnum
CREATE TYPE "BracketType" AS ENUM ('single_elimination', 'double_elimination');

-- CreateEnum
CREATE TYPE "BracketStatus" AS ENUM ('draft', 'live', 'completed', 'locked');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'viewer',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "status" "TournamentStatus" NOT NULL DEFAULT 'draft',
    "banner_url" TEXT,
    "logo_url" TEXT,
    "region" TEXT,
    "start_date" TIMESTAMPTZ(6),
    "end_date" TIMESTAMPTZ(6),
    "rules" TEXT,
    "scoring_config" JSONB NOT NULL DEFAULT '{"winPoints":3,"drawPoints":1,"lossPoints":0,"useKillPoints":false,"killPointValue":0,"useMapBonus":false,"mapWinPointValue":0}',
    "tiebreaker_config" JSONB NOT NULL DEFAULT '["points","wins","head_to_head","map_diff","kill_diff","total_kills","manual_seed"]',
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "tag" TEXT,
    "logo_url" TEXT,
    "country" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "nickname" TEXT NOT NULL,
    "real_name" TEXT,
    "role" TEXT,
    "country" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_participants" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "seed" INTEGER,
    "status" "ParticipantStatus" NOT NULL DEFAULT 'confirmed',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "top_qualify_count" INTEGER NOT NULL DEFAULT 2,
    "status" "GroupStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_participants" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "participant_id" UUID NOT NULL,
    "manual_rank_override" INTEGER,

    CONSTRAINT "group_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "stage_type" "StageType" NOT NULL,
    "group_id" UUID,
    "bracket_id" UUID,
    "round_number" INTEGER,
    "match_number" INTEGER NOT NULL DEFAULT 1,
    "participant_a_id" UUID,
    "participant_b_id" UUID,
    "score_a" INTEGER,
    "score_b" INTEGER,
    "winner_participant_id" UUID,
    "status" "MatchStatus" NOT NULL DEFAULT 'scheduled',
    "scheduled_at" TIMESTAMPTZ(6),
    "stream_url" TEXT,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_games" (
    "id" UUID NOT NULL,
    "match_id" UUID NOT NULL,
    "game_number" INTEGER NOT NULL,
    "map_name" TEXT,
    "score_a" INTEGER,
    "score_b" INTEGER,
    "kills_a" INTEGER NOT NULL DEFAULT 0,
    "kills_b" INTEGER NOT NULL DEFAULT 0,
    "deaths_a" INTEGER NOT NULL DEFAULT 0,
    "deaths_b" INTEGER NOT NULL DEFAULT 0,
    "winner_participant_id" UUID,

    CONSTRAINT "match_games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standings_snapshots" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "participant_id" UUID NOT NULL,
    "rank" INTEGER NOT NULL,
    "played" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "map_wins" INTEGER NOT NULL DEFAULT 0,
    "map_losses" INTEGER NOT NULL DEFAULT 0,
    "map_diff" INTEGER NOT NULL DEFAULT 0,
    "kills" INTEGER NOT NULL DEFAULT 0,
    "deaths" INTEGER NOT NULL DEFAULT 0,
    "kill_diff" INTEGER NOT NULL DEFAULT 0,
    "kd_ratio" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "tiebreaker_notes" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "standings_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brackets" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "type" "BracketType" NOT NULL DEFAULT 'single_elimination',
    "status" "BracketStatus" NOT NULL DEFAULT 'draft',
    "generated_from_stage" "StageType",
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brackets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bracket_slots" (
    "id" UUID NOT NULL,
    "bracket_id" UUID NOT NULL,
    "match_id" UUID,
    "slot_label" TEXT NOT NULL,
    "source_type" TEXT NOT NULL DEFAULT 'manual',
    "source_group_id" UUID,
    "source_rank" INTEGER,
    "participant_id" UUID,

    CONSTRAINT "bracket_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before_json" JSONB,
    "after_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tournaments_slug_key" ON "tournaments"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_participants_tournament_id_team_id_key" ON "tournament_participants"("tournament_id", "team_id");

-- CreateIndex
CREATE UNIQUE INDEX "groups_tournament_id_name_key" ON "groups"("tournament_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "group_participants_group_id_participant_id_key" ON "group_participants"("group_id", "participant_id");

-- CreateIndex
CREATE INDEX "matches_tournament_id_stage_type_idx" ON "matches"("tournament_id", "stage_type");

-- CreateIndex
CREATE INDEX "matches_group_id_idx" ON "matches"("group_id");

-- CreateIndex
CREATE INDEX "matches_bracket_id_idx" ON "matches"("bracket_id");

-- CreateIndex
CREATE UNIQUE INDEX "match_games_match_id_game_number_key" ON "match_games"("match_id", "game_number");

-- CreateIndex
CREATE INDEX "standings_snapshots_tournament_id_group_id_rank_idx" ON "standings_snapshots"("tournament_id", "group_id", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "standings_snapshots_group_id_participant_id_key" ON "standings_snapshots"("group_id", "participant_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_participants" ADD CONSTRAINT "group_participants_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_participants" ADD CONSTRAINT "group_participants_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "tournament_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_bracket_id_fkey" FOREIGN KEY ("bracket_id") REFERENCES "brackets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_participant_a_id_fkey" FOREIGN KEY ("participant_a_id") REFERENCES "tournament_participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_participant_b_id_fkey" FOREIGN KEY ("participant_b_id") REFERENCES "tournament_participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_participant_id_fkey" FOREIGN KEY ("winner_participant_id") REFERENCES "tournament_participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_games" ADD CONSTRAINT "match_games_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_games" ADD CONSTRAINT "match_games_winner_participant_id_fkey" FOREIGN KEY ("winner_participant_id") REFERENCES "tournament_participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standings_snapshots" ADD CONSTRAINT "standings_snapshots_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standings_snapshots" ADD CONSTRAINT "standings_snapshots_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standings_snapshots" ADD CONSTRAINT "standings_snapshots_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "tournament_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brackets" ADD CONSTRAINT "brackets_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bracket_slots" ADD CONSTRAINT "bracket_slots_bracket_id_fkey" FOREIGN KEY ("bracket_id") REFERENCES "brackets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bracket_slots" ADD CONSTRAINT "bracket_slots_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bracket_slots" ADD CONSTRAINT "bracket_slots_source_group_id_fkey" FOREIGN KEY ("source_group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bracket_slots" ADD CONSTRAINT "bracket_slots_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "tournament_participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
