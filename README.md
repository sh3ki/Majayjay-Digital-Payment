# 🎯 QR-Enabled Integrated Payment System

**Development of a QR-Enabled Integrated Payment System with Transactional Analytics Dashboard for Government Fees of Majayjay, Laguna**

---

## 📌 Quick Start

This repository contains comprehensive documentation and setup files for building a modern payment collection system for the Municipal Government of Majayjay, Laguna.

### 📚 Documentation Files

| File | Purpose |
|------|---------|
| [project-overview.md](project-overview.md) | High-level project summary, objectives, and scope |
| [project-architecture.md](project-architecture.md) | Technical architecture and system design |
| [project-full-details.md](project-full-details.md) | Comprehensive feature specifications and workflows |
| [design-specifications.md](design-specifications.md) | UI/UX design specs with blue color palette |
| [tech-stack.md](tech-stack.md) | Detailed technology stack and packages |
| [database-schema.md](database-schema.md) | Complete database structure and Prisma schema |
| [initial.md](initial.md) | Original system scope and requirements |

---

## 🚀 Project Setup Instructions

### Prerequisites

- **Node.js**: Latest LTS (v20.x or newer)
- **npm** or **yarn**: Package manager
- **Git**: Version control
- **NeonDB Account**: For PostgreSQL database
- **PayMongo Account**: For payment processing

### Step 1: Backend Setup

```bash
# Create backend directory
mkdir backend
cd backend

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express cors helmet dotenv @prisma/client jsonwebtoken bcryptjs joi axios socket.io winston morgan

# Install dev dependencies
npm install -D typescript ts-node nodemon @types/node @types/express jest ts-jest supertest @types/jest eslint prettier

# Generate TypeScript config
npx tsc --init

# Initialize Prisma
npx prisma init

# Create directory structure
mkdir -p src/{controllers,services,routes,middlewares,utils,config,webhooks}
```

### Step 2: Frontend Setup

```bash
# Create frontend directory (from project root)
npm create vite@latest frontend -- --template react --typescript

cd frontend

# Install dependencies
npm install react-router-dom @reduxjs/toolkit react-redux axios react-hook-form zod @hookform/resolvers

# Install UI & styling
npm install @mui/material @emotion/react @emotion/styled recharts qrcode.react react-icons tailwindcss postcss autoprefixer

# Install dev dependencies
npm install -D tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom

# Setup Tailwind
npx tailwindcss init -p
```

### Step 3: Database Setup

```bash
# Create .env file in backend root
cat > .env << EOF
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/majayjay_payment_system
JWT_SECRET=your_secret_key_here_min_32_chars
PAYMONGO_API_KEY=pk_test_xxxxx
PAYMONGO_SECRET_KEY=sk_test_xxxxx
EOF

# Run Prisma migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# (Optional) Seed database with initial data
npx prisma db seed
```

### Step 4: Environment Configuration

**Backend .env file:**
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://[user]:[password]@[host]:5432/majayjay_payment
JWT_SECRET=[min 32 random characters]
JWT_EXPIRATION=3600
REFRESH_TOKEN_EXPIRATION=604800
PAYMONGO_API_KEY=pk_test_xxxxx
PAYMONGO_SECRET_KEY=sk_test_xxxxx
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google-callback
SMS_API_KEY=xxxxx
EMAIL_SERVICE_API_KEY=xxxxx
FRONTEND_URL=http://localhost:3000
```

**Frontend .env file:**
```
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

### Google OAuth setup

1. Create an OAuth 2.0 Client ID in Google Cloud Console.
2. Add `http://localhost:5000/api/v1/auth/google-callback` to the authorized redirect URIs.
3. Copy the client ID and client secret into `backend/.env`.
4. Copy the client ID into `frontend/.env` as `VITE_GOOGLE_CLIENT_ID`.
5. Keep `FRONTEND_URL` set to your frontend origin, usually `http://localhost:3000` in development.

Note: the backend currently exposes local auth routes, but the Google OAuth flow itself still needs to be implemented in the auth layer before login via Google will work.

### Step 5: Run Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Backend runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/v1
- API Docs: http://localhost:5000/api/docs (when Swagger is configured)

---

## 📋 Development Roadmap

### Phase 1: Foundation & Core Features (Weeks 1-4)

#### Week 1: Project Setup
- [ ] Initialize backend and frontend
- [ ] Configure NeonDB database
- [ ] Setup environment variables
- [ ] Create project structure
- [ ] Initialize Git repository

#### Week 2: Authentication
- [ ] User registration (email/password)
- [ ] User login with JWT
- [ ] Google OAuth integration
- [ ] Password reset functionality
- [ ] Email verification
- [ ] Session management

#### Week 3: Core Features
- [ ] Bill management (create, view, search)
- [ ] Payment recording (cash & digital)
- [ ] QR code generation
- [ ] Official receipt generation
- [ ] Basic reporting

#### Week 4: Payment Integration
- [ ] PayMongo integration
- [ ] GCash payment flow
- [ ] Maya payment flow
- [ ] Payment webhook handling
- [ ] Payment status tracking

### Phase 2: Advanced Features (Weeks 5-8)

#### Week 5: Dashboard & Analytics
- [ ] Executive dashboard
- [ ] Real-time KPIs
- [ ] Collection reports
- [ ] Revenue breakdowns
- [ ] Export functionality

#### Week 6: Cashier Terminal
- [ ] Cashier interface
- [ ] Cash payment recording
- [ ] Terminal management
- [ ] Daily reconciliation
- [ ] Shift management

#### Week 7: Admin Controls
- [ ] Fee management
- [ ] User management
- [ ] Penalty configuration
- [ ] System settings
- [ ] Audit logging

#### Week 8: Testing & Optimization
- [ ] Unit tests
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Bug fixes

### Phase 3: Deployment & Launch (Weeks 9-10)

- [ ] Staging environment setup
- [ ] UAT (User Acceptance Testing)
- [ ] Production deployment
- [ ] User training
- [ ] Monitoring setup

---

## 🎨 Design System

### Color Palette (Blue Theme)

- **Primary Blue**: `#1565C0`
- **Light Blue**: `#E3F2FD`
- **Dark Blue**: `#0D47A1`
- **Accent Blue**: `#42A5F5`

### Status Colors

- **Success**: `#4CAF50` (Payments completed)
- **Warning**: `#FFC107` (Pending/overdue)
- **Error**: `#F44336` (Failures)
- **Info**: `#2196F3` (Messages)

See [design-specifications.md](design-specifications.md) for complete design system.

---

## 🛠️ Project Structure

```
PROJECT_ROOT/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── utils/
│   │   ├── config/
│   │   └── server.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── utils/
│   │   ├── types/
│   │   └── App.tsx
│   ├── public/
│   ├── .env
│   ├── vite.config.ts
│   └── package.json
│
├── docs/
│   ├── project-architecture.md
│   ├── project-overview.md
│   ├── project-full-details.md
│   ├── design-specifications.md
│   ├── tech-stack.md
│   └── database-schema.md
│
├── .gitignore
├── .env.example
└── README.md (this file)
```

---

## 🔄 Key Features Overview

### For Residents
✅ View bills online  
✅ Pay via QR code (GCash, Maya)  
✅ Track payment history  
✅ Receive SMS/Email confirmations  
✅ Download receipts  

### For Cashiers
✅ Record cash payments  
✅ Generate QR codes  
✅ Search bills & payers  
✅ Print receipts  
✅ Daily reconciliation  

### For Administrators
✅ Manage fees & penalties  
✅ User role management  
✅ View all reports  
✅ Monitor collections  
✅ System settings  

### System Features
✅ Real-time payment tracking  
✅ Automatic penalty calculation  
✅ Unified transaction ledger  
✅ Comprehensive audit trail  
✅ Multi-channel access  
✅ Advanced analytics  

---

## 📊 Technology Stack Summary

### Backend
- **Runtime**: Node.js (Latest LTS)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (via NeonDB)
- **ORM**: Prisma
- **Authentication**: JWT + OAuth 2.0
- **Payment**: PayMongo SDK

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS
- **UI Components**: Material-UI / Shadcn UI
- **Forms**: React Hook Form
- **Charts**: Recharts
- **QR Codes**: QRCode.react

### Database
- **Provider**: NeonDB (Serverless PostgreSQL)
- **Connection Pooling**: Prisma Client
- **Backups**: Automated daily

### DevOps
- **Version Control**: Git/GitHub
- **CI/CD**: GitHub Actions
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Railway/Render
- **Containerization**: Docker (optional)

See [tech-stack.md](tech-stack.md) for detailed information.

---

## 🔐 Security Features

- ✅ JWT authentication with refresh tokens
- ✅ Password encryption (bcryptjs)
- ✅ HTTPS/TLS encryption
- ✅ Rate limiting & DDoS protection
- ✅ Input validation & sanitization
- ✅ CSRF protection
- ✅ Comprehensive audit logging
- ✅ Role-based access control
- ✅ PCI DSS compliance for payments
- ✅ Secure API key management

---

## 📈 API Endpoints Quick Reference

```
Authentication:
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password

Bills:
GET    /api/v1/bills
POST   /api/v1/bills
GET    /api/v1/bills/:id
PUT    /api/v1/bills/:id

Payments:
POST   /api/v1/payments/create
GET    /api/v1/payments
GET    /api/v1/payments/:id
POST   /api/v1/payments/verify

QR Codes:
POST   /api/v1/qr-code/generate
GET    /api/v1/qr-code/:id

Reports:
GET    /api/v1/reports/collection
GET    /api/v1/reports/revenue
GET    /api/v1/reports/export

Webhooks:
POST   /api/v1/webhooks/paymongo
```

See [project-architecture.md](project-architecture.md) for complete API reference.

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm run test              # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

### Frontend Tests
```bash
cd frontend
npm run test             # Run tests
npm run test:coverage    # Coverage report
```

---

## 📝 Database Operations

### Create Database
```bash
# Using NeonDB console or CLI
createdb majayjay_payment_system
```

### Run Migrations
```bash
cd backend
npx prisma migrate dev --name migration_name
npx prisma migrate deploy   # Production
```

### Seed Database
```bash
npx prisma db seed
```

### View Database
```bash
npx prisma studio     # Opens Prisma Studio GUI
```

---

## 🚢 Deployment Instructions

### Frontend (Vercel)

```bash
# Connect GitHub repository to Vercel
# Set environment variables in Vercel console
# Automatic deployment on git push
```

### Backend (Railway/Render)

```bash
# Connect GitHub repository
# Set DATABASE_URL in environment variables
# Set other secrets (JWT_SECRET, PayMongo keys, etc.)
# Deploy
```

### Database (NeonDB)

- Already cloud-hosted
- Configure connection in backend .env
- Automated backups enabled

---

## 📞 Support & Documentation

### Primary Documentation
- [project-overview.md](project-overview.md) - Start here for project overview
- [project-full-details.md](project-full-details.md) - Complete feature specs
- [project-architecture.md](project-architecture.md) - Technical architecture
- [design-specifications.md](design-specifications.md) - UI/UX guidelines
- [tech-stack.md](tech-stack.md) - Technology details
- [database-schema.md](database-schema.md) - Database structure

### Getting Help
- Check documentation files
- Review code comments
- Check API logs for errors
- Use Sentry for error tracking
- Review audit logs for issues

---

## ✅ Pre-Launch Checklist

### Backend
- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] PayMongo integration tested
- [ ] API endpoints tested (Postman/Thunder Client)
- [ ] Unit tests passing
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Security headers added
- [ ] Rate limiting enabled

### Frontend
- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] Components created and styled
- [ ] Integration with backend APIs
- [ ] Form validation working
- [ ] Authentication flow tested
- [ ] Responsive design verified
- [ ] Cross-browser testing done
- [ ] Performance optimized
- [ ] Accessibility checked

### Database
- [ ] NeonDB account created
- [ ] Database created
- [ ] Migrations run
- [ ] Initial data seeded
- [ ] Indexes created
- [ ] Backups configured
- [ ] Connection pooling tested
- [ ] Query performance verified

### DevOps
- [ ] Git repository initialized
- [ ] GitHub Actions workflows created
- [ ] Hosting accounts set up (Vercel, Railway)
- [ ] Domain configured
- [ ] SSL certificates installed
- [ ] Monitoring tools configured
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan

---

## 📅 Project Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Foundation & Core Features | 4 weeks | Ready to Start |
| Advanced Features | 4 weeks | Planning |
| Testing & Optimization | 2 weeks | Planning |
| Deployment & Launch | 2 weeks | Planning |
| **Total** | **12 weeks** | **~3 Months** |

---

## 👥 Team Roles

| Role | Responsibilities |
|------|-----------------|
| **Project Manager** | Timeline, scope, stakeholder communication |
| **Backend Developer** | API, database, payment integration |
| **Frontend Developer** | UI, components, user experience |
| **QA Engineer** | Testing, quality assurance |
| **DevOps Engineer** | Deployment, monitoring, infrastructure |

---

## 📌 Important Notes

1. **Blue Color Palette**: All UI designs must use the blue theme as specified in design-specifications.md
2. **PayMongo Integration**: API keys required - get from PayMongo dashboard
3. **NeonDB Setup**: Database URL must be configured before running migrations
4. **Environment Variables**: Never commit .env files - use .env.example
5. **Git Workflow**: Use feature branches for development
6. **Testing**: Write tests for all new features
7. **Documentation**: Keep docs updated with changes

---

## 📄 License & Disclaimer

This project is developed for the Municipal Government of Majayjay, Laguna.

---

## 🎯 Next Steps

1. **Start with documentation**: Read project-overview.md for full context
2. **Setup development environment**: Follow Step 1-5 above
3. **Review architecture**: Study project-architecture.md
4. **Plan sprints**: Break down features from project-full-details.md
5. **Begin development**: Start with authentication module

---

**Project Status**: Ready for Development  
**Last Updated**: April 28, 2026  
**Version**: 1.0

---

**Need Help?**  
Refer to the comprehensive documentation files included in this repository. Each file covers specific aspects of the project in detail.
