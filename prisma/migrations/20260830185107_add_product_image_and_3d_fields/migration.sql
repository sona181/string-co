-- AlterTable
ALTER TABLE "products" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "model3dUrl" TEXT;

-- RenameForeignKey
ALTER TABLE "saved_products" RENAME CONSTRAINT "saved_products_productid_fkey" TO "saved_products_productId_fkey";

-- RenameForeignKey
ALTER TABLE "saved_products" RENAME CONSTRAINT "saved_products_userid_fkey" TO "saved_products_userId_fkey";

-- RenameForeignKey
ALTER TABLE "saved_variants" RENAME CONSTRAINT "saved_variants_userid_fkey" TO "saved_variants_userId_fkey";

-- RenameForeignKey
ALTER TABLE "saved_variants" RENAME CONSTRAINT "saved_variants_variantid_fkey" TO "saved_variants_variantId_fkey";

-- RenameIndex
ALTER INDEX "saved_products_userid_productid_key" RENAME TO "saved_products_userId_productId_key";

-- RenameIndex
ALTER INDEX "saved_variants_userid_variantid_key" RENAME TO "saved_variants_userId_variantId_key";
