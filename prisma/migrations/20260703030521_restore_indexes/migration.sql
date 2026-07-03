-- CreateIndex
CREATE INDEX "idx_listings_location" ON "listings" USING GIST ("location");

-- CreateIndex
CREATE INDEX "idx_listings_title_trgm" ON "listings" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "idx_listings_amenities" ON "listings" USING GIN ("amenities");

-- CreateIndex
CREATE INDEX "idx_users_name_trgm" ON "users" USING GIN ("first_name" gin_trgm_ops, "last_name" gin_trgm_ops);
