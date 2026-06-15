-- ShambaLoop Relational PostgreSQL Database Migration Schema
-- Targets PostgreSQL 13+ with UUID extensions

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    role VARCHAR(30) NOT NULL CHECK (role IN ('landowner', 'farmer', 'investor', 'admin')),
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    county VARCHAR(50) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index user queries by phone and county
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_county ON users(county);

-- 2. Listings Table
-- Jumia-style agricultural assets marketplace listings
CREATE TABLE IF NOT EXISTS listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(30) NOT NULL CHECK (type IN ('land', 'livestock', 'opportunity')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    location_county VARCHAR(50) NOT NULL,
    price_kes DECIMAL(14,2) NOT NULL, -- Lease cost, startup stake or stipends
    revenue_split_percent INTEGER, -- E.g., investor portion (40)
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    image_url TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    owner_name VARCHAR(100) NOT NULL,
    owner_phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(type);
CREATE INDEX IF NOT EXISTS idx_listings_county ON listings(location_county);
CREATE INDEX IF NOT EXISTS idx_listings_verified ON listings(verified);

-- 3. Land Details Table (1-to-1 or optional extension for Land Listings)
CREATE TABLE IF NOT EXISTS land_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL UNIQUE REFERENCES listings(id) ON DELETE CASCADE,
    acreage DECIMAL(10,2) NOT NULL,
    soil_type VARCHAR(100),
    water_source VARCHAR(100) NOT NULL,
    accessibility VARCHAR(150) NOT NULL,
    ideal_crops TEXT[] -- Structured array of perfect fit crops (e.g. Potatoes, Maize)
);

-- 4. Livestock Details Table (1-to-1 extension for animal equity)
CREATE TABLE IF NOT EXISTS livestock_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL UNIQUE REFERENCES listings(id) ON DELETE CASCADE,
    species VARCHAR(50) NOT NULL, -- dairy, poultry, goat, pig, beef
    tag_id VARCHAR(50) UNIQUE NOT NULL,
    breed VARCHAR(100) NOT NULL,
    expected_yield VARCHAR(150),
    revenue_share_config TEXT
);

-- 5. Opportunity Details Table (1-to-1 extension for Farm contracts/jobs)
CREATE TABLE IF NOT EXISTS opportunity_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL UNIQUE REFERENCES listings(id) ON DELETE CASCADE,
    required_skills TEXT[], 
    duration_months INTEGER NOT NULL,
    expected_workforce INTEGER NOT NULL DEFAULT 1,
    compensation_type VARCHAR(50) NOT NULL
);

-- 6. Land Lease Agreements Table
CREATE TABLE IF NOT EXISTS land_leases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE SET NULL,
    landowner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    acreage_leased DECIMAL(10,2) NOT NULL,
    price_per_acre_kes DECIMAL(14,2) NOT NULL,
    duration_months INTEGER NOT NULL,
    start_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SIGNED', 'COMPLETED', 'CANCELLED')),
    mpesa_escrow_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID' CHECK (mpesa_escrow_status IN ('UNPAID', 'ESCROWED', 'DISBURSED', 'REFUNDED')),
    payments_made DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Livestock Partnerships Table
CREATE TABLE IF NOT EXISTS livestock_partnerships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
    investor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    animal_tag_id VARCHAR(50) NOT NULL,
    animal_type VARCHAR(50) NOT NULL,
    breed VARCHAR(100) NOT NULL,
    split_percent_investor INTEGER NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PROPOSED' CHECK (status IN ('PROPOSED', 'ACTIVE', 'COMPLETED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Livestock Health Logs (Audit trail for health monitoring)
CREATE TABLE IF NOT EXISTS health_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partnership_id UUID NOT NULL REFERENCES livestock_partnerships(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    notes TEXT NOT NULL,
    recorded_by VARCHAR(120) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Livestock Production Logs (Financial split and output monitoring)
CREATE TABLE IF NOT EXISTS production_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partnership_id UUID NOT NULL REFERENCES livestock_partnerships(id) ON DELETE CASCADE,
    metric VARCHAR(50) NOT NULL, -- e.g. Milk Liters, Egg Trays, Maize Bags
    quantity DECIMAL(12,2) NOT NULL,
    revenue_kes DECIMAL(14,2) NOT NULL,
    investor_payout_kes DECIMAL(14,2) NOT NULL,
    farmer_payout_kes DECIMAL(14,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Verification Requests Table (Admin Queue)
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(100) NOT NULL,
    user_role VARCHAR(30) NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('ID_CARD', 'TITLE_DEED', 'LIVESTOCK_CERT')),
    document_number VARCHAR(100) NOT NULL,
    notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Escrow Transactions Audit Logs
CREATE TABLE IF NOT EXISTS mpesa_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(50) UNIQUE NOT NULL, -- From M-Pesa stk push, e.g., "RGC56H78UI"
    phone_number VARCHAR(20) NOT NULL,
    amount_kes DECIMAL(14,2) NOT NULL,
    purpose TEXT NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Auto-update timestamps trigger function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_listings_modtime BEFORE UPDATE ON listings FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
