-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('player', 'club_staff', 'super_admin');

-- CreateEnum
CREATE TYPE "ClubRole" AS ENUM ('owner', 'admin', 'staff', 'viewer');

-- CreateEnum
CREATE TYPE "CourtSurface" AS ENUM ('artificial_grass', 'concrete', 'synthetic', 'glass');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('M', 'F', 'X');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('unranked', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth');

-- CreateEnum
CREATE TYPE "Hand" AS ENUM ('left', 'right');

-- CreateEnum
CREATE TYPE "LeagueFormat" AS ENUM ('round_robin', 'divisions', 'ladder');

-- CreateEnum
CREATE TYPE "LeagueStatus" AS ENUM ('draft', 'active', 'finished', 'archived');

-- CreateEnum
CREATE TYPE "StandingTiebreaker" AS ENUM ('head_to_head', 'set_diff', 'game_diff', 'sets_won', 'games_won');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('active', 'withdrawn');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('draft', 'registration_open', 'in_progress', 'finished', 'archived');

-- CreateEnum
CREATE TYPE "CategoryGender" AS ENUM ('M', 'F', 'mixed');

-- CreateEnum
CREATE TYPE "DrawType" AS ENUM ('single_elim', 'double_elim', 'round_robin', 'groups_playoff');

-- CreateEnum
CREATE TYPE "TeamStatus" AS ENUM ('registered', 'confirmed', 'withdrawn');

-- CreateEnum
CREATE TYPE "MatchContext" AS ENUM ('league', 'tournament');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('scheduled', 'in_progress', 'finished', 'walkover', 'cancelled');

-- CreateEnum
CREATE TYPE "Side" AS ENUM ('A', 'B');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "accountType" "AccountType" NOT NULL DEFAULT 'player';

-- CreateTable
CREATE TABLE "club" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Mexico_City',
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_membership" (
    "clubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ClubRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_membership_pkey" PRIMARY KEY ("clubId","userId")
);

-- CreateTable
CREATE TABLE "court" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surface" "CourtSurface" NOT NULL DEFAULT 'artificial_grass',
    "isIndoor" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "court_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "court_availability" (
    "id" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "dayOfWeek" SMALLINT NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,

    CONSTRAINT "court_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "gender" "Gender",
    "birthDate" DATE,
    "skillLevel" "SkillLevel" NOT NULL DEFAULT 'unranked',
    "dominantHand" "Hand",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "format" "LeagueFormat" NOT NULL,
    "status" "LeagueStatus" NOT NULL DEFAULT 'draft',
    "startDate" DATE,
    "endDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "league_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_scoring_config" (
    "leagueId" TEXT NOT NULL,
    "pointsWin" INTEGER NOT NULL DEFAULT 3,
    "pointsLoss" INTEGER NOT NULL DEFAULT 0,
    "pointsDraw" INTEGER NOT NULL DEFAULT 1,
    "pointsWalkover" INTEGER NOT NULL DEFAULT 0,
    "bestOfSets" SMALLINT NOT NULL DEFAULT 3,
    "goldenPoint" BOOLEAN NOT NULL DEFAULT true,
    "tiebreakAt" SMALLINT NOT NULL DEFAULT 6,
    "tiebreaker1" "StandingTiebreaker" NOT NULL DEFAULT 'head_to_head',
    "tiebreaker2" "StandingTiebreaker" NOT NULL DEFAULT 'set_diff',
    "tiebreaker3" "StandingTiebreaker" NOT NULL DEFAULT 'game_diff',

    CONSTRAINT "league_scoring_config_pkey" PRIMARY KEY ("leagueId")
);

-- CreateTable
CREATE TABLE "league_round" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "name" TEXT,
    "scheduledDate" DATE,

    CONSTRAINT "league_round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_registration" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "division" TEXT,
    "seed" INTEGER,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "league_registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "TournamentStatus" NOT NULL DEFAULT 'draft',
    "startDate" DATE,
    "endDate" DATE,
    "registrationOpensAt" TIMESTAMP(3),
    "registrationClosesAt" TIMESTAMP(3),
    "location" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_category" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" "CategoryGender" NOT NULL DEFAULT 'mixed',
    "skillLevel" "SkillLevel" NOT NULL DEFAULT 'unranked',
    "drawType" "DrawType" NOT NULL,
    "maxTeams" INTEGER,
    "bestOfSets" SMALLINT NOT NULL DEFAULT 3,
    "entryFee" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'MXN',

    CONSTRAINT "tournament_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_team" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "name" TEXT,
    "seed" INTEGER,
    "status" "TeamStatus" NOT NULL DEFAULT 'registered',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_team_member" (
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,

    CONSTRAINT "tournament_team_member_pkey" PRIMARY KEY ("teamId","playerId")
);

-- CreateTable
CREATE TABLE "match" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "contextType" "MatchContext" NOT NULL,
    "leagueId" TEXT,
    "leagueRoundId" TEXT,
    "categoryId" TEXT,
    "bracketRound" TEXT,
    "courtId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "status" "MatchStatus" NOT NULL DEFAULT 'scheduled',
    "winnerSide" "Side",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_side" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "side" "Side" NOT NULL,
    "teamId" TEXT,

    CONSTRAINT "match_side_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_side_player" (
    "matchSideId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,

    CONSTRAINT "match_side_player_pkey" PRIMARY KEY ("matchSideId","playerId")
);

-- CreateTable
CREATE TABLE "match_set" (
    "matchId" TEXT NOT NULL,
    "setNumber" SMALLINT NOT NULL,
    "gamesA" SMALLINT NOT NULL,
    "gamesB" SMALLINT NOT NULL,
    "tiebreakA" SMALLINT,
    "tiebreakB" SMALLINT,

    CONSTRAINT "match_set_pkey" PRIMARY KEY ("matchId","setNumber")
);

-- CreateTable
CREATE TABLE "league_standing" (
    "leagueId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "division" TEXT,
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "setsFor" INTEGER NOT NULL DEFAULT 0,
    "setsAgainst" INTEGER NOT NULL DEFAULT 0,
    "gamesFor" INTEGER NOT NULL DEFAULT 0,
    "gamesAgainst" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "league_standing_pkey" PRIMARY KEY ("leagueId","registrationId")
);

-- CreateIndex
CREATE UNIQUE INDEX "club_slug_key" ON "club"("slug");

-- CreateIndex
CREATE INDEX "club_membership_userId_idx" ON "club_membership"("userId");

-- CreateIndex
CREATE INDEX "court_clubId_idx" ON "court"("clubId");

-- CreateIndex
CREATE UNIQUE INDEX "court_availability_courtId_dayOfWeek_key" ON "court_availability"("courtId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "player_userId_key" ON "player"("userId");

-- CreateIndex
CREATE INDEX "player_clubId_idx" ON "player"("clubId");

-- CreateIndex
CREATE INDEX "league_clubId_status_idx" ON "league"("clubId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "league_round_leagueId_roundNumber_key" ON "league_round"("leagueId", "roundNumber");

-- CreateIndex
CREATE INDEX "league_registration_leagueId_idx" ON "league_registration"("leagueId");

-- CreateIndex
CREATE UNIQUE INDEX "league_registration_leagueId_playerId_key" ON "league_registration"("leagueId", "playerId");

-- CreateIndex
CREATE INDEX "tournament_clubId_status_idx" ON "tournament"("clubId", "status");

-- CreateIndex
CREATE INDEX "tournament_category_clubId_idx" ON "tournament_category"("clubId");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_category_tournamentId_name_key" ON "tournament_category"("tournamentId", "name");

-- CreateIndex
CREATE INDEX "tournament_team_categoryId_idx" ON "tournament_team"("categoryId");

-- CreateIndex
CREATE INDEX "tournament_team_clubId_idx" ON "tournament_team"("clubId");

-- CreateIndex
CREATE INDEX "match_leagueId_idx" ON "match"("leagueId");

-- CreateIndex
CREATE INDEX "match_categoryId_idx" ON "match"("categoryId");

-- CreateIndex
CREATE INDEX "match_clubId_scheduledAt_idx" ON "match"("clubId", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "match_side_matchId_side_key" ON "match_side"("matchId", "side");

-- CreateIndex
CREATE UNIQUE INDEX "league_standing_registrationId_key" ON "league_standing"("registrationId");

-- CreateIndex
CREATE INDEX "league_standing_leagueId_division_points_idx" ON "league_standing"("leagueId", "division", "points");

-- AddForeignKey
ALTER TABLE "club_membership" ADD CONSTRAINT "club_membership_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_membership" ADD CONSTRAINT "club_membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "court" ADD CONSTRAINT "court_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "court_availability" ADD CONSTRAINT "court_availability_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "court"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player" ADD CONSTRAINT "player_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player" ADD CONSTRAINT "player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league" ADD CONSTRAINT "league_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_scoring_config" ADD CONSTRAINT "league_scoring_config_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "league"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_round" ADD CONSTRAINT "league_round_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "league"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_registration" ADD CONSTRAINT "league_registration_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "league"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_registration" ADD CONSTRAINT "league_registration_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament" ADD CONSTRAINT "tournament_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_category" ADD CONSTRAINT "tournament_category_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_team" ADD CONSTRAINT "tournament_team_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "tournament_category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_team_member" ADD CONSTRAINT "tournament_team_member_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "tournament_team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_team_member" ADD CONSTRAINT "tournament_team_member_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match" ADD CONSTRAINT "match_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match" ADD CONSTRAINT "match_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "league"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match" ADD CONSTRAINT "match_leagueRoundId_fkey" FOREIGN KEY ("leagueRoundId") REFERENCES "league_round"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match" ADD CONSTRAINT "match_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "tournament_category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match" ADD CONSTRAINT "match_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "court"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_side" ADD CONSTRAINT "match_side_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_side" ADD CONSTRAINT "match_side_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "tournament_team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_side_player" ADD CONSTRAINT "match_side_player_matchSideId_fkey" FOREIGN KEY ("matchSideId") REFERENCES "match_side"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_side_player" ADD CONSTRAINT "match_side_player_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_set" ADD CONSTRAINT "match_set_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_standing" ADD CONSTRAINT "league_standing_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "league"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_standing" ADD CONSTRAINT "league_standing_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "league_registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
