-- CreateEnum
CREATE TYPE "Genre" AS ENUM ('HIP_HOP', 'CLASSICAL', 'JAZZ', 'ROCK_METAL', 'ELECTRONIC', 'COUNTRY_FOLK', 'REGGAE', 'BLUES_SOUL');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "genre" "Genre";
