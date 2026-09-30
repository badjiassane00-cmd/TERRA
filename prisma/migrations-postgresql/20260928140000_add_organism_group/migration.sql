CREATE TYPE "OrganismGroup" AS ENUM (
  'PLANT', 'INSECT', 'BIRD', 'MAMMAL', 'REPTILE', 'AMPHIBIAN', 'FUNGUS', 'AQUATIC', 'OTHER'
);

ALTER TABLE "community_posts"
ADD COLUMN "organismGroup" "OrganismGroup" NOT NULL DEFAULT 'PLANT';
