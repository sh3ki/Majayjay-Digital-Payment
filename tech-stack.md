# 🛠️ Tech Stack Details

**Development of a QR-Enabled Integrated Payment System with Transactional Analytics Dashboard for Government Fees of Majayjay, Laguna**

---

## 📋 Table of Contents

1. [Backend Stack](#backend-stack)
2. [Frontend Stack](#frontend-stack)
3. [Database Stack](#database-stack)
4. [Payment Integration](#payment-integration)
5. [DevOps & Deployment](#devops--deployment)
6. [Development Tools](#development-tools)
7. [Testing Stack](#testing-stack)
8. [Performance & Monitoring](#performance--monitoring)
9. [Security Tools](#security-tools)
10. [Recommended Packages](#recommended-packages)

---

## 🖥️ Backend Stack

### Runtime & Framework

#### Node.js
- **Version**: Latest LTS (v20.x or newer)
- **Package Manager**: npm (v10.x+) or yarn
- **Why Node.js?**
  - Non-blocking I/O for handling multiple concurrent payments
  - Event-driven architecture
  - Excellent for real-time applications
  - Large ecosystem of packages
  - Single language across stack (JavaScript/TypeScript)

#### Express.js
- **Version**: 4.18.x or newer
- **Why Express?**
  - Lightweight and flexible
  - Mature and production-ready
  - Large community support
  - Extensive middleware ecosystem
  - Perfect for RESTful APIs

### Language & TypeScript

#### TypeScript
- **Version**: 5.x
- **Configuration**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  }
}
```

### ORM & Database Query

#### Prisma ORM
- **Version**: 5.x or newer
- **Why Prisma?**
  - Type-safe database access
  - Automatic migrations
  - Intuitive data model
  - Built-in connection pooling
  - Excellent TypeScript support
  - Query optimization

**Prisma Schema Example:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int     @id @default(autoincrement())
  email     String  @unique
  name      String
  role      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Authentication & Security

#### JWT (JSON Web Tokens)
- **Package**: jsonwebtoken (jwt.sign, jwt.verify)
- **Token Structure**:
```javascript
{
  sub: user_id,
  email: user_email,
  role: user_role,
  iat: issued_at_time,
  exp: expiration_time
}
```
- **Secret Key**: Store in .env (minimum 32 characters)
- **Expiration**: 1 hour (access token), 7 days (refresh token)

#### Password Hashing
- **Package**: bcryptjs
- **Configuration**: Salt rounds = 10
- **Algorithm**: bcrypt (adaptive hashing function)

#### OAuth 2.0
- **Google OAuth Integration**:
  - Package: passport-google-oauth20 or auth0-express
  - Callback URL: https://system.lgu.gov.ph/api/v1/auth/google-callback
  - Scopes: profile, email

### API Documentation & Validation

#### Joi
- **Purpose**: Request validation
- **Schema Definition**:
```javascript
const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().max(100).required()
});
```

#### Swagger/OpenAPI
- **Package**: swagger-ui-express, swagger-jsdoc
- **Endpoint**: /api/docs
- **Benefits**: API documentation, testing interface, client generation

### Logging & Monitoring

#### Winston
- **Purpose**: Application logging
- **Configuration**:
```javascript
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```
- **Log Levels**: error, warn, info, debug, trace

#### Morgan
- **Purpose**: HTTP request logging
- **Format**: Combined log format
- **Output**: Logs request method, path, status code, response time

### Environment Management

#### dotenv
- **Purpose**: Environment variable management
- **File**: .env (root directory, never committed)
- **Example**:
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your_secret_key_here
PAYMONGO_API_KEY=pk_test_xxxxx
```

### Real-Time Communication (Optional)

#### Socket.IO
- **Purpose**: Real-time updates (dashboards, payment status)
- **Alternative**: Server-Sent Events (SSE)
- **Configuration**: CORS enabled for frontend domain

---

## 🎨 Frontend Stack

### Framework & Build

#### React
- **Version**: 18.x or newer
- **Why React?**
  - Component-based architecture
  - Virtual DOM for performance
  - Large ecosystem
  - Excellent for complex UIs
  - Strong community & resources

#### Vite
- **Version**: 5.x or newer
- **Why Vite?**
  - Lightning-fast development server (HMR)
  - Optimized production builds
  - ES modules native support
  - Smaller bundle sizes
  - Faster builds than Create React App

**Vite Configuration:**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
```

### Language & Type Safety

#### TypeScript
- **Version**: 5.x
- **Configuration**: Strict mode enabled

#### ESLint & Prettier
- **ESLint**: Code quality and linting
- **Prettier**: Code formatting
- **Pre-commit**: Husky + lint-staged

### State Management

#### Redux Toolkit
- **Purpose**: Global state management
- **Structure**:
  - Slices (auth, bills, payments, dashboard)
  - Actions (creators auto-generated)
  - Reducers (type-safe)
  - Selectors (memoized)

**Redux Slice Example:**
```javascript
const billsSlice = createSlice({
  name: 'bills',
  initialState: [],
  reducers: {
    setBills: (state, action) => {
      state = action.payload;
    },
    addBill: (state, action) => {
      state.push(action.payload);
    }
  }
});
```

#### Alternative: Zustand
- **Lightweight alternative** to Redux
- **Simpler API** for smaller stores
- **Can be combined** with Redux for large stores

### HTTP Client

#### Axios
- **Purpose**: HTTP requests to backend
- **Configuration**:
```javascript
const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  timeout: 10000
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Handle token refresh or logout
    }
    return Promise.reject(error);
  }
);
```

### UI Component Library

#### React MUI (Material-UI)
- **Why MUI?**
  - Comprehensive component library
  - Built-in themes and customization
  - Accessibility best practices
  - Production-ready components

**MUI Components Used:**
- Button, TextField, Card, Table, Dialog, Alert
- DataGrid (complex tables)
- DatePicker (calendar components)
- ChartContainer (layout)

#### Alternative: Shadcn UI
- **Modern alternative**
- **Headless components** (fully customizable)
- **Based on Radix UI** (accessibility)
- **Copy-paste components** (no dependencies)

### Form Handling

#### React Hook Form
- **Why RHF?**
  - Minimal re-renders
  - Small bundle size
  - Excellent TypeScript support
  - Easy integration with validation

**Form Example:**
```javascript
const { register, handleSubmit, formState: { errors } } = useForm({
  defaultValues: { email: '', password: '' },
  resolver: zodResolver(schema)
});

return (
  <form onSubmit={handleSubmit(onSubmit)}>
    <input {...register('email')} />
    {errors.email && <span>{errors.email.message}</span>}
  </form>
);
```

### Form Validation

#### Zod
- **Purpose**: Runtime type validation
- **Benefits**: TypeScript inference, composable schemas
- **Alternative**: Yup (more familiar to some)

### Data Tables

#### TanStack React Table (formerly React Table)
- **Purpose**: Complex data table management
- **Features**:
  - Sorting, filtering, pagination
  - Column visibility toggle
  - Responsive design
  - No built-in UI (use with MUI/Shadcn)

### Charting & Visualization

#### Recharts
- **Purpose**: Interactive charts
- **Components Used**:
  - LineChart (trends, revenue over time)
  - BarChart (comparisons)
  - PieChart (distribution)
  - AreaChart (cumulative data)
- **Why Recharts?**
  - Built with React components
  - Responsive and composable
  - Good documentation
  - TypeScript support

**Alternative: Chart.js with react-chartjs-2**

### QR Code Generation

#### QRCode.react
- **Purpose**: Generate QR codes in React
- **Usage**:
```javascript
import QRCode from 'qrcode.react';

<QRCode 
  value={JSON.stringify(paymentData)}
  size={256}
  level="H"
  includeMargin={true}
/>
```

### CSS & Styling

#### Tailwind CSS
- **Why Tailwind?**
  - Utility-first approach
  - Minimal CSS output
  - Easy theming
  - Blue color customization

**Tailwind Configuration:**
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        green: {
          primary: '#1565C0',
          light: '#E3F2FD',
          dark: '#0D47A1',
          accent: '#42A5F5'
        }
      }
    }
  }
}
```

### Icons

#### React Icons
- **Libraries**: Lucide, Feather, Material Design, Font Awesome
- **Usage**:
```javascript
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
```

### Routing

#### React Router v6
- **Purpose**: Client-side navigation
- **Features**:
  - Nested routes
  - Dynamic segments
  - Query parameters
  - Protected routes

**Routing Example:**
```javascript
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/bills" element={<BillsList />} />
    <Route path="/payments/:id" element={<PaymentDetail />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>
```

---

## 🗄️ Database Stack

### NeonDB (PostgreSQL)

#### Database Provider
- **Service**: NeonDB (serverless PostgreSQL)
- **URL Format**: `postgresql://user:password@host/database`
- **Benefits**:
  - Auto-scaling
  - Branching for development
  - Automated backups
  - Point-in-time restore
  - 99.96% SLA

#### PostgreSQL Version
- **Version**: 13+ (NeonDB default)
- **Why PostgreSQL?**
  - ACID compliance
  - Complex queries support
  - JSON data type
  - Full-text search
  - Excellent for transaction-heavy apps
  - Scalability

### Connection Pooling

#### Prisma Client
- **Connection Pool**: Built-in connection pooling
- **Max Connections**: 25 (default, configurable)
- **Idle Timeout**: 30 seconds

#### Alternative: PgBouncer
- **Standalone connection pooler**
- **Benefits**: Database-level pooling, language-agnostic

### Database Management

#### Adminer / pgAdmin
- **Purpose**: Database administration UI
- **Features**: Query execution, data inspection, backup management

#### DBeaver
- **Alternative**: Desktop database client
- **Features**: Visual query builder, ERD diagram

---

## 💳 Payment Integration

### PayMongo SDK

#### Integration Details
- **Provider**: PayMongo
- **Payment Methods**: GCash, Maya, Bank Transfer
- **API Endpoints**:
  - POST /payments (create payment intent)
  - GET /payments/{id} (retrieve payment)
  - POST /webhooks (webhook handlers)

#### NodeJS SDK Installation
```bash
npm install @paymongo/sdk
# or
yarn add @paymongo/sdk
```

#### Integration Pattern
```javascript
const PayMongo = require('@paymongo/sdk');

const client = new PayMongo({
  key: process.env.PAYMONGO_API_KEY,
  secret: process.env.PAYMONGO_SECRET_KEY
});

// Create payment
const payment = await client.payment.create({
  data: {
    attributes: {
      amount: 525000, // in cents
      currency: 'PHP',
      description: 'RPT Payment',
      statement_descriptor: 'Majayjay Payment',
      type: 'card'
    }
  }
});

// Handle webhook
app.post('/webhooks/paymongo', async (req, res) => {
  const { data } = req.body;
  if (data.attributes.status === 'paid') {
    // Process payment
  }
});
```

#### Webhook Security
- **Signature Verification**: Validate PayMongo webhook signature
- **Package**: crypto (built-in Node.js)

### Payment Status Handling

#### Payment States
- PENDING: Payment intent created, awaiting user confirmation
- PAID: Payment successful
- FAILED: Payment failed
- EXPIRED: Payment intent expired

#### Webhook Events
- payment.paid: Payment successfully processed
- payment.failed: Payment failed
- payment.expired: Payment intent expired

---

## 🚀 DevOps & Deployment

### Version Control

#### Git & GitHub
- **Repository**: GitHub (or GitLab/Bitbucket)
- **Branching Strategy**: Git Flow
  - main: Production-ready code
  - develop: Development branch
  - feature/*: Feature branches
  - hotfix/*: Emergency fixes

### Containerization

#### Docker
- **Purpose**: Container packaging
- **Benefits**: Environment consistency, easy deployment

**Dockerfile Example:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

#### Docker Compose
- **Purpose**: Multi-container development
- **Includes**: Backend, frontend, database services

### CI/CD Pipeline

#### GitHub Actions
- **Purpose**: Automated testing and deployment
- **Workflows**:
  - Run tests on PR
  - Build Docker image
  - Push to registry
  - Deploy to production

**Workflow Example:**
```yaml
name: CI/CD

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test
      - run: npm run build
```

### Frontend Deployment

#### Vercel
- **Platform**: Vercel (Recommended)
- **Benefits**:
  - Zero-config deployment
  - Automatic HTTPS
  - Preview environments
  - Environment variables
  - Serverless functions
- **Alternative**: Netlify

### Backend Deployment

#### Railway / Render
- **Platform**: Railway or Render
- **Configuration**:
  - Environment variables
  - Automatic deployments from GitHub
  - Database connections
  - Custom domains
  - SSL certificates

**Alternative**: Heroku, DigitalOcean, AWS

### Database Deployment

#### NeonDB Hosting
- **Setup**: Already cloud-hosted
- **Backups**: Automatic daily backups
- **Restore**: Point-in-time restore capability
- **Regions**: Multiple regions available

---

## 🛠️ Development Tools

### Code Editor
- **Recommended**: Visual Studio Code (VS Code)
- **Extensions**:
  - Prettier (formatting)
  - ESLint (linting)
  - Thunder Client / Insomnia (API testing)
  - REST Client (inline API testing)
  - Peacock (workspace theming)

### Package Managers
- **npm**: Default, comes with Node.js
- **yarn**: Alternative (faster installs, lock files)
- **pnpm**: Newest alternative (disk space efficient)

### API Testing Tools
- **Postman**: GUI API testing
- **Thunder Client**: VS Code extension
- **Insomnia**: Open-source alternative
- **REST Client**: VS Code extension for .http files

### Database Tools
- **pgAdmin**: Web-based PostgreSQL admin
- **DBeaver**: Desktop database client
- **Adminer**: Lightweight web admin
- **DataGrip**: JetBrains IDE (paid)

---

## 🧪 Testing Stack

### Unit Testing

#### Jest
- **Framework**: JavaScript testing framework
- **Configuration**:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts']
};
```

#### Testing Library (React)
- **Purpose**: React component testing
- **Philosophy**: Test user interactions, not implementation

**Example:**
```javascript
import { render, screen } from '@testing-library/react';
import Button from './Button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### Integration Testing

#### Supertest
- **Purpose**: HTTP assertion library
- **Use Case**: API endpoint testing

**Example:**
```javascript
const request = require('supertest');
const app = require('../app');

describe('POST /api/v1/auth/login', () => {
  it('should login user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: 'password' });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});
```

### E2E Testing

#### Cypress
- **Purpose**: End-to-end testing
- **Features**:
  - Interactive test runner
  - Time-travel debugging
  - Network mocking
  - Screenshot/video recording

**Alternative**: Playwright

---

## 📊 Performance & Monitoring

### Performance Tools

#### Lighthouse
- **Purpose**: Performance, accessibility, SEO audits
- **Integration**: CI/CD pipeline, manual testing

#### Web Vitals
- **Metrics**: Largest Contentful Paint (LCP), First Input Delay (FID), Cumulative Layout Shift (CLS)
- **Package**: web-vitals
- **Monitoring**: Send to analytics service

### Monitoring & Analytics

#### Google Analytics
- **Purpose**: User behavior tracking
- **Metrics**: Page views, transactions, user flow

#### Sentry
- **Purpose**: Error tracking and reporting
- **Features**:
  - Real-time error alerts
  - Stack trace debugging
  - Release tracking
  - Source map uploading

#### New Relic / DataDog
- **Purpose**: Application performance monitoring
- **Features**: Metrics, logs, traces

---

## 🔒 Security Tools

### Dependency Scanning

#### npm audit
- **Purpose**: Identify vulnerabilities in dependencies
- **Command**: `npm audit`, `npm audit fix`

#### Snyk
- **Purpose**: Continuous dependency scanning
- **Features**: Vulnerability alerts, auto-fix PRs

### Static Code Analysis

#### SonarQube
- **Purpose**: Code quality and security analysis
- **Metrics**: Code smells, bugs, vulnerabilities

### Secrets Management

#### HashiCorp Vault
- **Purpose**: Secure secrets storage
- **Alternative**: AWS Secrets Manager, GitHub Secrets

---

## 📦 Recommended Packages

### Backend Packages

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "@prisma/client": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.1.0",
    "joi": "^17.11.0",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "winston": "^3.11.0",
    "morgan": "^1.10.0",
    "axios": "^1.6.2",
    "@paymongo/sdk": "^1.0.0",
    "socket.io": "^4.7.2",
    "node-cron": "^3.0.3"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/express": "^4.17.21",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2",
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "supertest": "^6.3.3",
    "prisma": "^5.0.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  }
}
```

### Frontend Packages

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@reduxjs/toolkit": "^1.9.7",
    "react-redux": "^8.1.3",
    "axios": "^1.6.2",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.4",
    "@mui/material": "^5.14.13",
    "@mui/icons-material": "^5.14.13",
    "recharts": "^2.10.3",
    "qrcode.react": "^1.0.1",
    "react-icons": "^4.12.0",
    "tailwindcss": "^3.3.6",
    "socket.io-client": "^4.7.2"
  },
  "devDependencies": {
    "vite": "^5.0.8",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.3",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "vitest": "^1.0.4"
  }
}
```

---

## 🔄 Development Workflow

### Installation Steps

**Backend:**
```bash
# Clone repository
git clone <repo-url>
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Setup database
npx prisma migrate dev --name init
npx prisma db seed

# Start development server
npm run dev
```

**Frontend:**
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build & Production

**Backend Build:**
```bash
npm run build
npm start
```

**Frontend Build:**
```bash
npm run build
# Output: dist/ directory
```

---

## 📈 Scalability Recommendations

### Database
- Connection pooling
- Query indexing
- Partitioning for large tables
- Read replicas for reporting

### Backend
- Horizontal scaling (multiple instances)
- Load balancing (nginx, AWS ELB)
- Caching (Redis)
- Message queues (RabbitMQ for async tasks)

### Frontend
- CDN for static assets
- Lazy loading components
- Code splitting
- Compression (gzip, brotli)

---

**Tech Stack Status**: Ready for Development  
**Last Updated**: April 28, 2026  
**Version**: 1.0
