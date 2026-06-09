-- Decisión manual de ascenso/descenso cuando hay empate en un grupo.
ALTER TABLE "league_group_slot" ADD COLUMN "manualMovement" "GroupMovement";

-- Se elimina la lista de prioridad de desempates: los empates por el
-- ascenso/descenso los resuelve el organizador manualmente.
ALTER TABLE "league_scoring_config"
  DROP COLUMN "tiebreaker1",
  DROP COLUMN "tiebreaker2",
  DROP COLUMN "tiebreaker3";

DROP TYPE "StandingTiebreaker";
