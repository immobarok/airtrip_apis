🏠 Airbnb-Type Platform Database Architecture Guide
📋 Table of Contents
Architecture Overview
Role-Based Access Control
Performance Optimizations
Query Patterns
Scaling Strategy
Security Best Practices
Architecture Overview
Core Design Principles
Table
Principle	Implementation
Single Source of Truth	All users in users table with role flags
Normalized + Denormalized	Core entities normalized, stats denormalized for reads
Soft Deletes	deleted_at column on all main tables
UUID Primary Keys	Prevents enumeration attacks, enables distributed systems
Partitioning	Audit logs partitioned by month for performance
Entity Relationship Summary
plain
users (core entity)
├── customer_profiles (1:1)
├── host_profiles (1:1)
├── admin_profiles (1:1)
│   └── super_admin_profiles (1:1)
├── listings (1:N)
│   ├── listing_photos (1:N)
│   ├── listing_availability (1:N)
│   └── bookings (1:N)
│       ├── payments (1:1)
│       └── reviews (1:1)
├── conversations (1:N)
│   └── messages (1:N)
├── wishlists (1:N)
│   └── wishlist_items (1:N)
└── notifications (1:N)
Role-Based Access Control
Role Hierarchy
plain
Super Admin (Level 10)
├── Can create/delete admins
├── Can modify system settings
├── Full audit log access
└── Can access all data

Admin (Level 5-9)
├── Can manage users (view, suspend)
├── Can manage listings (approve, reject, suspend)
├── Can manage bookings (cancel, refund)
├── Can manage reviews (moderate)
└── Cannot create other admins

Host
├── Can create/manage own listings
├── Can manage bookings for own listings
├── Can respond to reviews
├── Can message guests
└── Cannot access other hosts' data

Customer
├── Can search/book listings
├── Can write reviews after stay
├── Can manage wishlists
├── Can message hosts
└── Cannot access host/admin features
Permission Matrix
Table
Action	Customer	Host	Admin	Super Admin
View own profile	✅	✅	✅	✅
Edit own profile	✅	✅	✅	✅
Create listing	❌	✅	❌	✅
Manage all listings	❌	❌	✅	✅
Book listing	✅	✅	✅	✅
Cancel any booking	❌	Own only	✅	✅
Process refunds	❌	❌	✅	✅
Moderate reviews	❌	Own only	✅	✅
Create admin accounts	❌	❌	❌	✅
View audit logs	❌	❌	❌	✅
Modify system settings	❌	❌	❌	✅
Performance Optimizations
1. Indexing Strategy
B-Tree Indexes (Default)
Used for: exact match, range queries, sorting
sql
-- High-cardinality columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);

-- Composite indexes for common query patterns
CREATE INDEX idx_listings_price_status ON listings(base_price_per_night, status) 
    WHERE status = 'active';
GiST Indexes (Geospatial)
Used for: location-based searches
sql
CREATE INDEX idx_listings_location ON listings USING gist(location);
-- Enables fast queries like:
-- "Find listings within 5km of this point"
GIN Indexes (Array/JSON)
Used for: array containment, full-text search
sql
CREATE INDEX idx_listings_amenities ON listings USING gin(amenities);
CREATE INDEX idx_listings_title_trgm ON listings USING gin(title gin_trgm_ops);
-- Enables: WHERE amenities @> ARRAY['wifi', 'pool']
Partial Indexes
Used for: frequently filtered subsets
sql
CREATE INDEX idx_listings_active ON listings(status) WHERE status = 'active';
-- Much smaller than full index, faster for common queries
2. Query Optimization Techniques
Materialized Views for Dashboards
sql
-- Refresh every hour for host dashboards
CREATE MATERIALIZED VIEW host_dashboard_stats AS
SELECT host_id, ... FROM bookings ... GROUP BY host_id;
CREATE INDEX ON host_dashboard_stats(host_id);
REFRESH MATERIALIZED VIEW CONCURRENTLY host_dashboard_stats;
Connection Pooling (PgBouncer)
Transaction Pooling: For stateless API requests
Session Pooling: For long-running admin queries
Recommended: 100-200 connections per pool
Read Replicas
Primary: Writes + real-time reads
Replica 1: Search queries (listings)
Replica 2: Analytics queries (admin dashboards)
Replica 3: Reporting queries
3. Caching Strategy
Table
Data Type	Cache Layer	TTL	Invalidation
Listing details	Redis	1 hour	On update
Search results	Redis	5 minutes	Time-based
User sessions	Redis	24 hours	On logout
Host dashboard	Redis	15 minutes	On booking change
System settings	Redis	Infinite	On admin update
Query Patterns
Search Listings (Most Critical)
Scenario: User searches for listings in Paris, Dec 15-20, 2 guests, under $200/night
Execution Plan:
Geospatial filter (GiST index) - Find listings within radius
Availability filter (B-tree index) - Exclude booked dates
Guest count filter (B-tree index) - max_guests >= 2
Price filter (Partial index) - base_price <= 200
Sort (B-tree index) - by price or rating
Limit - Return 20 results
Expected Performance: < 50ms with proper indexes
Booking Creation (Concurrency Critical)
Scenario: Two users try to book the same dates simultaneously
Solution: Advisory Locks + Defense in Depth
sql
-- Step 1: Acquire lock on (listing_id + date_range)
SELECT pg_advisory_xact_lock(hashtext('listing_id||check_in||check_out'));

-- Step 2: Re-verify availability (race condition protection)
-- Step 3: Insert booking
-- Step 4: Lock auto-released at transaction end
Admin User Search
Scenario: Admin searches users by email/name with role filter
Optimization:
Trigram index for fuzzy text search
Partial indexes for active users
Cursor-based pagination for large result sets
Scaling Strategy
Phase 1: Single Instance (0-10K users)
Single PostgreSQL instance
Application-level caching
Daily backups
Phase 2: Read Replicas (10K-100K users)
1 Primary + 2 Read Replicas
PgBouncer connection pooling
Redis for session/cache
Phase 3: Sharding (100K+ users)
Shard by geography: US-East, US-West, EU, Asia
Shard by user_id hash: Even distribution
Cross-shard queries via FDW (Foreign Data Wrappers)
Phase 4: Microservices (1M+ users)
User Service: users, profiles, auth
Listing Service: listings, photos, availability
Booking Service: bookings, payments
Search Service: Elasticsearch/OpenSearch
Notification Service: messages, notifications
Security Best Practices
1. Row Level Security (RLS)
sql
-- Users can only see their own data
CREATE POLICY users_self_access ON users
    FOR ALL USING (id = current_setting('app.current_user_id')::UUID);

-- Admins can see all
CREATE POLICY users_admin_access ON users
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admin_profiles 
                WHERE user_id = current_setting('app.current_user_id')::UUID)
    );
2. Data Encryption
Table
Layer	Method
At-rest	PostgreSQL TDE or filesystem encryption
In-transit	TLS 1.3 for all connections
Sensitive fields	Application-level encryption (PII, payment tokens)
3. Audit Logging
All admin actions logged with:
Actor ID and role
Before/after values (JSONB)
IP address and user agent
Timestamp
4. Password Security
bcrypt with cost factor 12+
Failed login lockout (5 attempts)
Password rotation for admin accounts
Maintenance Tasks
Daily
Vacuum analyze on high-churn tables
Backup verification
Slow query log review
Weekly
Index bloat check
Partition management (audit logs)
Cache hit ratio monitoring
Monthly
Full statistics refresh
Capacity planning review
Security audit
Monitoring Metrics
Table
Metric	Target	Alert Threshold
Query response time (p99)	< 100ms	> 500ms
Database CPU	< 70%	> 85%
Connection pool usage	< 80%	> 90%
Cache hit ratio	> 99%	< 95%
Replication lag	< 1s	> 5s
Dead tuples ratio	< 10%	> 20%
Quick Start Commands
bash
# Create database
createdb airbnb_platform

# Run schema
psql -d airbnb_platform -f airbnb_schema.sql

# Verify indexes
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

# Check table sizes
SELECT relname as table_name, 
       pg_size_pretty(pg_total_relation_size(relid)) as total_size
FROM pg_catalog.pg_statio_user_tables 
ORDER BY pg_total_relation_size(relid) DESC;