# 🏗️ Project Architecture

**Development of a QR-Enabled Integrated Payment System with Transactional Analytics Dashboard for Government Fees of Majayjay, Laguna**

---

## 📋 Architecture Overview

This document outlines the technical architecture for the LGU Digital Payment & Transaction Management System using a modern, scalable, three-tier architecture with separation of concerns.

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js (Latest LTS)
- **Framework**: Express.js
- **Language**: JavaScript/TypeScript
- **Authentication**: JWT + OAuth 2.0 (Google)
- **Payment Gateway**: PayMongo SDK
- **Database**: NeonDB (PostgreSQL)
- **ORM**: Prisma
- **Validation**: Joi / Zod
- **Logging**: Winston
- **Environment Management**: dotenv

### Frontend
- **Framework**: React (Latest)
- **Build Tool**: Vite
- **Language**: TypeScript
- **State Management**: Redux Toolkit / Zustand
- **HTTP Client**: Axios
- **UI Component Library**: React MUI / Shadcn UI
- **Form Handling**: React Hook Form
- **Data Table**: TanStack React Table
- **Charting**: Chart.js / Recharts
- **Styling**: Tailwind CSS
- **Icons**: React Icons / Lucide React
- **QR Code Generation**: QRCode.react / qrcode.js

### Database
- **Provider**: NeonDB (PostgreSQL)
- **Connection Pool**: Prisma Client
- **Query Builder**: Prisma ORM
- **Migrations**: Prisma Migrations

### Payment Integration
- **Provider**: PayMongo
- **Webhooks**: For payment status updates
- **Supported Methods**: GCash, Maya, Bank Transfer

### DevOps & Hosting (Future)
- **Containerization**: Docker
- **Version Control**: Git
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel (Frontend) / Railway/Render (Backend)

---

## 🏛️ System Architecture Layers

### 1. Presentation Layer (Frontend - React)

```
/frontend
├── /public
├── /src
│   ├── /components
│   │   ├── /common (Header, Navbar, Footer, Sidebar)
│   │   ├── /auth (Login, Register, ForgotPassword)
│   │   ├── /payments (PaymentForm, QRDisplay, BillView)
│   │   ├── /dashboard (Analytics, Charts, KPIs)
│   │   ├── /admin (FeeManagement, UserManagement, Reports)
│   │   └── /cashier (CashierTerminal, TransactionRecording)
│   ├── /pages
│   ├── /layouts
│   ├── /hooks
│   ├── /services (API calls)
│   ├── /store (Redux/Zustand)
│   ├── /utils
│   ├── /types
│   ├── /constants
│   └── App.tsx
```

**Responsibilities**:
- User interface rendering
- Client-side routing
- Form validation & submission
- State management
- API communication
- Real-time updates

---

### 2. Business Logic Layer (Backend - Express.js + Node.js)

```
/backend
├── /src
│   ├── /controllers (Request handlers)
│   ├── /services (Business logic)
│   ├── /routes (API endpoints)
│   ├── /middlewares (Auth, validation, error handling)
│   ├── /models (Database models via Prisma)
│   ├── /utils (Helpers, formatters)
│   ├── /config (Environment, database, payment)
│   ├── /constants
│   ├── /webhooks (PayMongo webhooks)
│   └── server.ts
├── prisma/
│   └── schema.prisma (Database schema)
├── .env
└── package.json
```

**Responsibilities**:
- API endpoint handling
- Business logic implementation
- Database operations
- Payment processing
- User authentication & authorization
- Data validation
- Audit logging
- Error handling

---

### 3. Data Layer (NeonDB - PostgreSQL)

**Database Responsibilities**:
- Data persistence
- Transaction management
- Relationship integrity
- Query optimization
- Backup & recovery

---

## 🔄 API Architecture

### RESTful Endpoints Structure

```
/api/v1/
├── /auth
│   ├── POST /register
│   ├── POST /login
│   ├── POST /logout
│   ├── POST /forgot-password
│   ├── GET /verify-email
│   └── POST /refresh-token

├── /users
│   ├── GET / (me - current user)
│   ├── PUT /:id
│   ├── GET /profile/:id
│   └── GET /all (admin only)

├── /fees
│   ├── GET / (list all fee types)
│   ├── POST / (create - admin)
│   ├── PUT /:id (update - admin)
│   └── DELETE /:id (delete - admin)

├── /bills
│   ├── GET / (list bills)
│   ├── POST / (create bill - admin/cashier)
│   ├── GET /:id (bill details)
│   └── PUT /:id/status (update status)

├── /payments
│   ├── POST /create (initiate payment)
│   ├── GET / (transaction history)
│   ├── GET /:id (payment details)
│   ├── POST /verify (verify payment)
│   └── GET /receipt/:id (download receipt)

├── /qr-code
│   ├── POST /generate (generate QR)
│   ├── GET /:id (get QR details)

├── /cashier
│   ├── POST /record-cash (record cash payment)
│   ├── GET /terminal-dashboard
│   └── GET /daily-summary

├── /dashboard
│   ├── GET /analytics
│   ├── GET /revenue-summary
│   ├── GET /collection-by-department
│   └── GET /payment-methods-breakdown

├── /reports
│   ├── GET /collection (collection reports)
│   ├── GET /revenue
│   ├── GET /payment-channels
│   └── GET /export (export data)

└── /webhooks
    └── POST /paymongo (PayMongo webhooks)
```

---

## 🗄️ Database Schema (High-Level)

### Core Tables

1. **users** - User accounts with roles
2. **roles** - Role definitions (Admin, Cashier, Viewer, Resident)
3. **fee_types** - Fee categories (RPT, Cedula, Water, etc.)
4. **bills** - Individual bills generated
5. **bills_items** - Fee items in each bill
6. **payments** - Payment transactions
7. **qr_codes** - QR code records
8. **payment_methods** - Accepted payment methods
9. **audit_logs** - Transaction audit trails
10. **notifications** - SMS/Email notifications
11. **departments** - LGU departments
12. **penalty_rules** - Penalty calculation rules

---

## 🔐 Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────┐
│           Authentication Flow                            │
└─────────────────────────────────────────────────────────┘

1. User Registration
   └─→ Email/Password or Google OAuth
       └─→ Email Verification
           └─→ User Account Created

2. User Login
   └─→ Credentials Validated
       └─→ JWT Token Generated
           └─→ Refresh Token Stored in DB
               └─→ Access Token Sent to Frontend

3. API Request
   └─→ Authorization Header (Bearer Token)
       └─→ Token Verified
           └─→ User Permissions Checked
               └─→ Request Processed

4. Token Refresh
   └─→ Refresh Token Validated
       └─→ New Access Token Generated
           └─→ User Session Extended
```

---

## 💳 Payment Processing Flow

```
┌──────────────────────────────────────────────────────────┐
│         PayMongo Payment Processing Flow                  │
└──────────────────────────────────────────────────────────┘

1. User Initiates Payment
   └─→ Frontend sends payment request

2. Backend Creates Payment Intent (PayMongo)
   └─→ PayMongo returns Client Secret

3. Frontend Displays Payment Method Selection
   └─→ User chooses GCash/Maya/Bank Transfer

4. PayMongo Processing
   └─→ User completes payment in PayMongo modal

5. PayMongo Webhook Callback
   └─→ Backend receives status update
       └─→ Payment recorded in database
           └─→ OR (Official Receipt) generated
               └─→ Notification sent (SMS/Email)

6. Frontend Receives Confirmation
   └─→ Transaction marked as PAID
       └─→ User sees receipt & confirmation
```

---

## 🔄 QR Code Generation & Payment Flow

```
┌──────────────────────────────────────────────────────────┐
│            QR Code Payment Workflow                       │
└──────────────────────────────────────────────────────────┘

1. Bill Created/Viewed
   └─→ Backend generates QR code data
       └─→ QR contains: Transaction ID, Amount, Reference

2. Frontend Renders QR Code
   └─→ User scans with mobile wallet
       └─→ QR redirects to PayMongo payment page

3. Payment Processing (as above)

4. Real-time Status Update
   └─→ WebSocket or polling updates frontend
       └─→ Bill status changes to PAID
           └─→ Receipt displayed
```

---

## 📊 Real-Time Updates Architecture

### WebSocket Integration (Optional Enhancement)

```
Frontend ←→ Socket.IO/WebSocket ←→ Backend
   ↓
Transaction updates
Payment confirmations
Dashboard analytics refresh
Notification alerts
```

---

## 🔐 Security Measures

- **JWT Tokens**: Secure authentication
- **HTTPS/TLS**: Encrypted communication
- **Password Hashing**: bcrypt
- **Rate Limiting**: DDoS protection
- **Input Validation**: Joi/Zod
- **CORS Configuration**: Restricted origin access
- **Audit Logging**: All transactions logged
- **Environment Variables**: Sensitive data in .env
- **Database Encryption**: NeonDB SSL connections
- **API Key Management**: PayMongo API keys secured

---

## 📈 Scalability Considerations

- **Database Indexing**: On frequently queried columns
- **Connection Pooling**: Prisma Client pooling
- **Caching**: Redis (future enhancement)
- **CDN**: For static assets
- **Load Balancing**: Multiple backend instances
- **Horizontal Scaling**: Containerized deployment

---

## 🚀 Deployment Architecture

### Development Environment
```
Local machine → localhost:3000 (Frontend)
             → localhost:5000 (Backend)
             → NeonDB (Development database)
```

### Production Environment
```
Vercel → Frontend deployment
Railway/Render → Backend deployment
NeonDB → Production database
GitHub → Source control
```

---

## 📝 API Response Standard

All API responses follow a consistent format:

```json
{
  "success": true,
  "status": 200,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🔄 Error Handling

Consistent error response structure:

```json
{
  "success": false,
  "status": 400,
  "message": "Bad Request",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 📋 Project Structure Summary

```
PROJECT_ROOT/
├── frontend/                 # React application
├── backend/                  # Express.js API
├── docs/                     # Documentation files
├── .gitignore
├── README.md
└── docker-compose.yml        # For local development (optional)
```

---

## ✅ Integration Checklist

- [ ] Node.js & npm setup
- [ ] React Vite setup
- [ ] NeonDB database creation
- [ ] Prisma setup & migrations
- [ ] PayMongo account & API keys
- [ ] Express server initialization
- [ ] JWT authentication setup
- [ ] OAuth Google integration
- [ ] Database connection verification
- [ ] API endpoint testing
- [ ] Frontend component development
- [ ] PayMongo webhook setup
- [ ] Testing suite setup
- [ ] Deployment configuration

---

**Status**: Ready for Development  
**Last Updated**: April 28, 2026
