CREATE TABLE saved_products (
  id TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT saved_products_pkey PRIMARY KEY (id),
  CONSTRAINT saved_products_userId_productId_key UNIQUE ("userId", "productId"),
  CONSTRAINT saved_products_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT saved_products_productId_fkey FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE saved_variants (
  id TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  label TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT saved_variants_pkey PRIMARY KEY (id),
  CONSTRAINT saved_variants_userId_variantId_key UNIQUE ("userId", "variantId"),
  CONSTRAINT saved_variants_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT saved_variants_variantId_fkey FOREIGN KEY ("variantId") REFERENCES product_variants(id) ON DELETE CASCADE ON UPDATE CASCADE
);
