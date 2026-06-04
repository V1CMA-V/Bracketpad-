/*
  Warnings:

  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `clubs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `competitions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `courts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `group_pairs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `groups` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `matches` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pairs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `players` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_competition_id_fkey";

-- DropForeignKey
ALTER TABLE "clubs" DROP CONSTRAINT "clubs_owner_user_id_fkey";

-- DropForeignKey
ALTER TABLE "competitions" DROP CONSTRAINT "competitions_club_id_fkey";

-- DropForeignKey
ALTER TABLE "courts" DROP CONSTRAINT "courts_club_id_fkey";

-- DropForeignKey
ALTER TABLE "group_pairs" DROP CONSTRAINT "group_pairs_group_id_fkey";

-- DropForeignKey
ALTER TABLE "group_pairs" DROP CONSTRAINT "group_pairs_pair_id_fkey";

-- DropForeignKey
ALTER TABLE "groups" DROP CONSTRAINT "groups_category_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_category_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_court_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_group_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_pair1_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_pair2_id_fkey";

-- DropForeignKey
ALTER TABLE "matches" DROP CONSTRAINT "matches_winner_pair_id_fkey";

-- DropForeignKey
ALTER TABLE "pairs" DROP CONSTRAINT "pairs_category_id_fkey";

-- DropForeignKey
ALTER TABLE "pairs" DROP CONSTRAINT "pairs_player1_id_fkey";

-- DropForeignKey
ALTER TABLE "pairs" DROP CONSTRAINT "pairs_player2_id_fkey";

-- DropForeignKey
ALTER TABLE "players" DROP CONSTRAINT "players_club_id_fkey";

-- DropForeignKey
ALTER TABLE "players" DROP CONSTRAINT "players_user_id_fkey";

-- DropForeignKey
ALTER TABLE "sets" DROP CONSTRAINT "sets_match_id_fkey";

-- DropTable
DROP TABLE "categories";

-- DropTable
DROP TABLE "clubs";

-- DropTable
DROP TABLE "competitions";

-- DropTable
DROP TABLE "courts";

-- DropTable
DROP TABLE "group_pairs";

-- DropTable
DROP TABLE "groups";

-- DropTable
DROP TABLE "matches";

-- DropTable
DROP TABLE "pairs";

-- DropTable
DROP TABLE "players";

-- DropTable
DROP TABLE "sets";

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "CategoryFormat";

-- DropEnum
DROP TYPE "CompetitionStatus";

-- DropEnum
DROP TYPE "CompetitionType";

-- DropEnum
DROP TYPE "CourtSurface";

-- DropEnum
DROP TYPE "DominantHand";

-- DropEnum
DROP TYPE "Gender";

-- DropEnum
DROP TYPE "MatchRound";

-- DropEnum
DROP TYPE "MatchStatus";

-- DropEnum
DROP TYPE "PairStatus";

-- DropEnum
DROP TYPE "PreferredPosition";

-- DropEnum
DROP TYPE "ScoringType";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
