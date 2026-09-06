-- Convert CategoryName enum to plain text and add slug + parentId

-- 1. Add slug column with a temporary default so existing rows don't fail
ALTER TABLE "categories" ADD COLUMN "slug" TEXT NOT NULL DEFAULT '';

-- 2. Cast enum name to text in-place
ALTER TABLE "categories" ALTER COLUMN "name" TYPE TEXT USING "name"::text;

-- 3. Populate slug from existing names (lowercase of the enum value)
UPDATE "categories" SET "slug" = lower("name");

-- 4. Remove the temporary default — slug will be required going forward
ALTER TABLE "categories" ALTER COLUMN "slug" DROP DEFAULT;

-- 5. Add parentId for subcategory support (nullable)
ALTER TABLE "categories" ADD COLUMN "parentId" TEXT;

-- 6. Add unique constraint on slug
ALTER TABLE "categories" ADD CONSTRAINT "categories_slug_key" UNIQUE ("slug");

-- 7. Add self-referential FK for parent
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 8. Drop the old enum type (Postgres keeps it until explicitly dropped)
DROP TYPE IF EXISTS "CategoryName";
