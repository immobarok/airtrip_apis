-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at (ignoring tables that Prisma already handles well, but good for database integrity)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_listings_updated_at ON listings;
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_listing_availability_updated_at ON listing_availability;
CREATE TRIGGER update_listing_availability_updated_at BEFORE UPDATE ON listing_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update listing stats trigger
CREATE OR REPLACE FUNCTION update_listing_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update listing average rating and review count
    UPDATE listings SET
        total_reviews = (SELECT COUNT(*) FROM reviews WHERE listing_id = NEW.listing_id AND is_public = TRUE),
        average_rating = COALESCE((SELECT ROUND(AVG(overall_rating), 1) FROM reviews WHERE listing_id = NEW.listing_id AND is_public = TRUE), 0)
    WHERE id = NEW.listing_id;

    -- Update host stats
    UPDATE host_profiles SET
        total_reviews = (SELECT SUM(total_reviews) FROM listings WHERE host_id = (SELECT host_id FROM listings WHERE id = NEW.listing_id)),
        average_rating = COALESCE((SELECT ROUND(AVG(average_rating), 1) FROM listings WHERE host_id = (SELECT host_id FROM listings WHERE id = NEW.listing_id) AND total_reviews > 0), 0)
    WHERE user_id = (SELECT host_id FROM listings WHERE id = NEW.listing_id);

    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_listing_stats_after_review ON reviews;
CREATE TRIGGER update_listing_stats_after_review
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_listing_stats();

-- Generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_reference IS NULL OR NEW.booking_reference = '' THEN
        NEW.booking_reference := 'BK' || TO_CHAR(NOW(), 'YYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_booking_reference ON bookings;
CREATE TRIGGER set_booking_reference
    BEFORE INSERT ON bookings
    FOR EACH ROW EXECUTE FUNCTION generate_booking_reference();


-- ============================================================
-- 2. ADVANCED INDEXES
-- ============================================================

-- PostGIS geospatial index
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings USING gist(location);

-- Trigram indices for fast text search
CREATE INDEX IF NOT EXISTS idx_listings_title_trgm ON listings USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON users USING gin(first_name gin_trgm_ops, last_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_listings_amenities ON listings USING gin(amenities);

-- Partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_photos_primary ON listing_photos(listing_id) WHERE is_primary = TRUE;


-- ============================================================
-- 3. DATA INTEGRITY CONSTRAINTS
-- ============================================================

-- Booking Logic
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS chk_checkout_after_checkin;
ALTER TABLE bookings ADD CONSTRAINT chk_checkout_after_checkin CHECK (check_out_date > check_in_date);

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS chk_guests_positive;
ALTER TABLE bookings ADD CONSTRAINT chk_guests_positive CHECK (number_of_guests > 0);

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS chk_nights_match;
ALTER TABLE bookings ADD CONSTRAINT chk_nights_match CHECK (number_of_nights = (check_out_date - check_in_date));

-- Listing & Pricing Rules
ALTER TABLE listings DROP CONSTRAINT IF EXISTS chk_max_guests_positive;
ALTER TABLE listings ADD CONSTRAINT chk_max_guests_positive CHECK (max_guests > 0);

ALTER TABLE listings DROP CONSTRAINT IF EXISTS chk_base_price_positive;
ALTER TABLE listings ADD CONSTRAINT chk_base_price_positive CHECK (base_price_per_night >= 0);

ALTER TABLE listings DROP CONSTRAINT IF EXISTS chk_valid_coordinates;
ALTER TABLE listings ADD CONSTRAINT chk_valid_coordinates CHECK (
    latitude IS NULL OR longitude IS NULL OR
    (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
);


-- ============================================================
-- 4. VIEWS
-- ============================================================

-- Active listings with host info
CREATE OR REPLACE VIEW active_listings_view AS
SELECT 
    l.*,
    u.first_name as host_first_name,
    u.last_name as host_last_name,
    u.avatar_url as host_avatar,
    hp.is_identity_verified as host_verified,
    hp.average_rating as host_rating
FROM listings l
JOIN users u ON l.host_id = u.id
LEFT JOIN host_profiles hp ON u.id = hp.user_id
WHERE l.status = 'active' AND u.is_active = TRUE;

-- Booking details view
CREATE OR REPLACE VIEW booking_details_view AS
SELECT 
    b.*,
    l.title as listing_title,
    l.city as listing_city,
    l.country as listing_country,
    guest.first_name as guest_first_name,
    guest.last_name as guest_last_name,
    guest.email as guest_email,
    host.first_name as host_first_name,
    host.last_name as host_last_name,
    host.email as host_email
FROM bookings b
JOIN listings l ON b.listing_id = l.id
JOIN users guest ON b.guest_id = guest.id
JOIN users host ON b.host_id = host.id;


-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Note: Policies generally rely on current_setting which might require application configuration
-- To prevent lockout for Prisma, you typically define permissive policies for service role, 
-- but we include these directly from sql.sql as requested.

-- Make sure to uncomment these if you plan to query directly from a frontend client like Supabase

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- DROP POLICY IF EXISTS users_self_access ON users;
-- CREATE POLICY users_self_access ON users FOR ALL USING (id = current_setting('app.current_user_id', true)::UUID);

-- DROP POLICY IF EXISTS users_admin_access ON users;
-- CREATE POLICY users_admin_access ON users FOR ALL USING (
--     EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = current_setting('app.current_user_id', true)::UUID)
-- );

-- DROP POLICY IF EXISTS listings_host_access ON listings;
-- CREATE POLICY listings_host_access ON listings FOR ALL USING (host_id = current_setting('app.current_user_id', true)::UUID);

-- DROP POLICY IF EXISTS listings_public_access ON listings;
-- CREATE POLICY listings_public_access ON listings FOR SELECT USING (status = 'active');

-- DROP POLICY IF EXISTS bookings_guest_access ON bookings;
-- CREATE POLICY bookings_guest_access ON bookings FOR ALL USING (guest_id = current_setting('app.current_user_id', true)::UUID);

-- DROP POLICY IF EXISTS bookings_host_access ON bookings;
-- CREATE POLICY bookings_host_access ON bookings FOR ALL USING (
--     host_id = current_setting('app.current_user_id', true)::UUID
-- );
