-- Real Estate MVP Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'buyer' CHECK (role IN ('buyer', 'agent', 'admin')),
  phone VARCHAR(20),
  avatar VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL,
  property_type VARCHAR(30) CHECK (property_type IN ('house', 'apartment', 'condo', 'townhouse', 'land', 'commercial')),
  listing_type VARCHAR(10) CHECK (listing_type IN ('sale', 'rent')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold', 'rented', 'inactive')),
  bedrooms INT,
  bathrooms NUMERIC(3,1),
  area_sqft NUMERIC(10, 2),
  lot_size NUMERIC(10, 2),
  year_built INT,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'USA',
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  agent_id INT REFERENCES users(id) ON DELETE SET NULL,
  features JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Saved/Favorited properties
CREATE TABLE IF NOT EXISTS saved_properties (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  property_id INT REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- Refresh tokens for rotating JWT sessions
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  replaced_by_hash VARCHAR(64),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Inquiries / Contact requests
CREATE TABLE IF NOT EXISTS inquiries (
  id SERIAL PRIMARY KEY,
  property_id INT REFERENCES properties(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(20),
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'closed')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Property views tracking
CREATE TABLE IF NOT EXISTS property_views (
  id SERIAL PRIMARY KEY,
  property_id INT REFERENCES properties(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  ip_address VARCHAR(45),
  viewed_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_agent ON properties(agent_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_property ON inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- Sample seed data
INSERT INTO users (name, email, password, role, phone) VALUES
('Admin User', 'admin@realestate.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '555-0100'),
('Sarah Johnson', 'sarah@realestate.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'agent', '555-0101'),
('Mike Chen', 'mike@realestate.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'agent', '555-0102')
ON CONFLICT (email) DO NOTHING;

INSERT INTO properties (title, description, price, property_type, listing_type, bedrooms, bathrooms, area_sqft, address, city, state, zip_code, agent_id, features, images) VALUES
('Modern Downtown Loft', 'Stunning open-concept loft in the heart of downtown. Features exposed brick, industrial finishes, and breathtaking city views.', 850000, 'apartment', 'sale', 2, 2, 1400, '123 Main St #8B', 'New York', 'NY', '10001', 2, '["City Views","Gym","Rooftop","Doorman","Central AC"]', '["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"]'),
('Suburban Family Home', 'Spacious 4-bedroom home in top school district. Large backyard, updated kitchen, 2-car garage.', 650000, 'house', 'sale', 4, 3, 2800, '456 Oak Avenue', 'Austin', 'TX', '78701', 2, '["Backyard","Garage","Updated Kitchen","Pool","Smart Home"]', '["https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800","https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800"]'),
('Beachfront Condo', 'Wake up to ocean views every day. This luxury condo features floor-to-ceiling windows and premium finishes.', 1200000, 'condo', 'sale', 3, 2, 1800, '789 Ocean Blvd #12A', 'Miami', 'FL', '33101', 3, '["Ocean View","Pool","Beach Access","Concierge","Valet Parking"]', '["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800","https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800"]'),
('Cozy Studio Apartment', 'Perfect starter apartment in vibrant neighborhood. Hardwood floors, updated bathroom, steps from transit.', 2200, 'apartment', 'rent', 1, 1, 550, '321 Elm Street #3', 'Chicago', 'IL', '60601', 2, '["Hardwood Floors","Laundry in Building","Near Transit","Dishwasher"]', '["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800"]'),
('Luxury Penthouse', 'Iconic penthouse with 360-degree views. Private rooftop terrace, chef kitchen, 3-car garage.', 4500000, 'condo', 'sale', 5, 5, 5200, '1000 Skyline Drive PH1', 'Los Angeles', 'CA', '90001', 3, '["Rooftop Terrace","Wine Cellar","Smart Home","Private Elevator","Ocean View"]', '["https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800","https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"]'),
('Craftsman Bungalow', 'Charming 1920s bungalow fully restored with modern amenities. Original hardwood, vintage tile, lush garden.', 875000, 'house', 'sale', 3, 2, 1650, '567 Maple Lane', 'Portland', 'OR', '97201', 2, '["Garden","Fireplace","Hardwood Floors","Updated Kitchen","EV Charger"]', '["https://images.unsplash.com/photo-1575517111839-3a3843ee7f5d?w=800"]')
ON CONFLICT DO NOTHING;
