<div align="center">

# **Innkeep**

**Full-stack CRUD Hotel Management System**

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=stripe&logoColor=white)
![Pytest](https://img.shields.io/badge/Pytest-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white)

</div>

## 📖 About

Innkeep is a full-stack hotel booking and management platform built end-to-end from database design and business logic through a polished and responsive UI.

The app is backed by a FastAPI backend and PostgreSQL database with business logic (conflict prevention, dynamic pricing, multi-room transactions). Payments run through Stripe in test mode — a real payment integration, safe to use with no real transactions.

Guests can browse rooms, build a multi-room cart, and check out securely. Admins have a dashboard to manage room types, rooms, pricing, bookings, and users, with live revenue analytics.

## 🏗️ Architecture Overview

```mermaid
graph TB
    subgraph "🖥️ Frontend"
        UI["🌐 React + Vite<br/>Guest Portal | Admin Dashboard"]
    end
    subgraph "🔧 Backend"
        API[FastAPI REST API]
        AUTH[JWT Auth]
        BOOKING[Booking Engine]
        PAY[Payment Processing]
    end
    subgraph "💾 Data & External"
        DB[(PostgreSQL)]
        STRIPE[Stripe API]
    end
    UI --> API
    API --> AUTH
    API --> BOOKING
    API --> PAY
    AUTH --> DB
    BOOKING --> DB
    PAY --> DB
    PAY --> STRIPE
    style UI fill:#e1f5fe
    style API fill:#f3e5f5
    style DB fill:#e8f5e8
    style STRIPE fill:#fff3e0
```

## 🗄️ Database Schema

![Database Schema](./docs/schema.png)

## ✨ Features

### Core Features

- 🛏️ **Room browsing**: browse room types with image carousels, bed/pricing details
- 🔐 **Full authentication**: register, login, persistent sessions, protected routes
- 🛒 **Multi-booking shopping vart**: booking flow with live price calculation
- 💳 **Real Stripe payment integration**: create, saved, and use payment methods in test mode
- 📅 **Guest booking management**: view, cancel, early checkout
- 🛠️ **Full admin CRUD**: room types, rooms, images, pricing rules
- 👥 **User Roles**: role-based dashboard access (guest / admin)

### Advanced Features

- 🔄 **Atomic multi-room booking**: books several room types in one transaction; if any item can't be fulfilled, nothing is booked and the payment is automatically refunded
- 📈 **Dynamic per-night pricing**: weekday/weekend/holiday rates calculated per night across a stay
- ⏱️**Early checkout billing**: prorated refund for unused nights, minus a 10% early-checkout fee, with a guaranteed minimum of one billed night
- 🚫 **Booking conflict prevention**: real overlap-checking against existing reservations
- 📊 **Revenue analytics dashboard**: 30-day revenue/booking trend chart, summary stats
- 🛡️ **Self-demotion protection**: an admin can't accidentally revoke their own access

### Technical Features

- 🔑 **Data security**: JWT authentication with bcrypt password hashing
- 🚧 **Role-based access control**: enforced at the API level, not just hidden in the UI
- ✅ **Automated test units**: isolated in-memory database, no real DB or external API calls during tests
- 🗂️ **Schema migrations**: managed by Alembic
- 🧱 **Reusable frontend components**: React framework library (Button, Dropdown, Modal, Input)

## 🛠️ Technologies

### Backend

- FastAPI (Python)
- PostgreSQL + SQLAlchemy + Alembic
- JWT (python-jose) + bcrypt
- Stripe SDK (PaymentIntents, saved payment methods, refunds)
- Pytest + httpx

### Frontend

- React + Vite
- Tailwind CSS
- React Router
- Recharts (admin analytics)
- Stripe.js / Stripe Elements
- Lucide Icons

### DevOps & Tools

- Docker
- Alembic (database migrations)
- Vercel (frontend hosting)
- Railway (backend + database hosting)

## 🚀 Installation

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL
- Docker (optional, for containerized setup)

### Quick Start

**Backend:**

```bash
# from project root
python -m venv .venv
.venv\Scripts\activate      # Windows
pip install -r requirements.txt
```

Create a `.env` file in the project root:

```
SECRET_KEY=your-jwt-secret
DATABASE_URL=postgresql://postgres:password@localhost:5432/innkeep
TOKEN_TIMER=20160
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:8000
```

Run migrations and start the server:

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

**Frontend:**

```bash
cd src   # or wherever package.json lives
npm install
npm run dev
```

### Docker Setup

> _Coming soon — a `Dockerfile` and `docker-compose.yml` for one-command local setup (backend + PostgreSQL) are in progress._

### Production Deployment

> _Coming soon — deployment guide for hosting the backend on Railway and the frontend on Vercel._

---

## 📚 Documentation & API Reference

Once the backend is running, interactive API documentation (Swagger UI) is available at:

```
http://localhost:8000/docs
```

This includes every endpoint, request/response schemas, and the ability to test requests directly from the browser.

## 🤝 Contributing

This is a personal portfolio project, but feedback and suggestions are welcome. Feel free to open an issue or reach out directly.
