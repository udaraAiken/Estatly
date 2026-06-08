# 🏡 Estatly — Real Estate MVP

A full-stack real estate platform built with **MERN + PostgreSQL**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + React Router |
| Backend | Node.js + Express |
| Database | PostgreSQL 15 |
| Auth | JWT (JSON Web Tokens) |
| Styling | Custom CSS (no UI library) |

## Features

### 🏠 Property Listings
- Browse properties with filtering by city, type, price, bedrooms, listing type
- Sorting: newest, price, size, popularity
- Pagination
- Detailed property pages with image gallery
- View counter

### 🔍 Search & Filters
- Full-text search across title, city, address
- Advanced sidebar filters
- Multiple sort options

### 👤 Authentication
- Register as buyer or agent
- JWT-based secure authentication
- Role-based access (buyer / agent / admin)

### 💛 Save Properties
- Save/unsave listings (heart button)
- Dedicated saved properties page

### 📬 Inquiries
- Contact agent form on every listing
- Inquiry management dashboard for agents

### 🗂 Agent Dashboard
- Stats overview
- Create/edit/delete listings
- Manage inquiries with status updates

## Quick Start

### Option 1: Docker (Recommended)
```bash
git clone <repo>
cd realestate
docker-compose up --build
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

### Option 2: Manual

**Prerequisites:** Node.js 18+, PostgreSQL 15+

**1. Setup Database**
```bash
psql -U postgres -c "CREATE DATABASE realestate_db;"
```

**2. Backend**
```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials
npm install
npm run dev
```

**3. Frontend**
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

### Auth
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | /api/auth/register | Public | Register |
| POST | /api/auth/login | Public | Login |
| GET | /api/auth/me | Auth | Get current user |

### Properties
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | /api/properties | Public | List with filters |
| GET | /api/properties/stats | Public | Platform stats |
| GET | /api/properties/:id | Public | Single property |
| POST | /api/properties | Agent | Create listing |
| PUT | /api/properties/:id | Agent | Update listing |
| DELETE | /api/properties/:id | Agent | Delete listing |
| GET | /api/properties/saved | Auth | Saved properties |
| POST | /api/properties/:id/save | Auth | Toggle save |

### Inquiries
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | /api/inquiries/property/:id | Public | Send inquiry |
| GET | /api/inquiries | Agent | List inquiries |
| PATCH | /api/inquiries/:id/status | Agent | Update status |

## Database Schema

```
users          — id, name, email, password, role, phone
properties     — id, title, price, type, listing_type, beds, baths, area, location, agent_id, features, images
saved_properties — user_id, property_id (favorites)
inquiries      — property_id, user_id, name, email, message, status
property_views — tracking table
```

## Demo Accounts
After running the seed:
- **Agent 1:** sarah@realestate.com / password
- **Agent 2:** mike@realestate.com / password

## Project Structure

```
realestate/
├── backend/
│   ├── config/         # DB connection + schema.sql
│   ├── controllers/    # authController, propertyController, inquiryController
│   ├── middleware/     # JWT auth middleware
│   ├── routes/         # auth, properties, inquiries
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/ # Navbar, Footer, PropertyCard
│   │   ├── context/    # AuthContext
│   │   ├── pages/      # Home, Listings, Detail, Login, Register, Saved, Dashboard
│   │   └── utils/      # api.js, format.js
│   └── index.html
└── docker-compose.yml
```

## Next Steps for Production
- [ ] Image upload (AWS S3 / Cloudinary)
- [ ] Map integration (Google Maps / Mapbox)
- [ ] Email notifications (SendGrid)
- [ ] Payment processing for premium listings
- [ ] Property comparison feature
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
