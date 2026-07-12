# TransitOps – Smart Transport Operations Platform

TransitOps is a production-quality, responsive Transport Management System (TMS) built with Next.js 16/15, React 19, MongoDB Atlas, and Tailwind CSS v4. It allows logistics organizations to manage fleet registry, driver roster compliance, cargo load capacities, trip dispatches, maintenance shop locking, and operational expenses in one unified portal.

---

## 🌟 Key Features

- **Authentication & RBAC**: NextAuth v5 (Auth.js) credentials authentication checking user access matrices (Admin, Fleet Manager, Dispatcher, Safety Officer, Financial Analyst).
- **Interactive Dashboards**: Real-time KPI cards and responsive Recharts (Pie, Area, Line, Bar charts) rendering fleet utilization, refuel costs, and ROI.
- **Asset Registries**: Full CRUD support for vehicles and drivers with validation checks (such as unique license numbers, and unique registration numbers).
- **Validation Business Rules**:
  - Excludes Retired/In Shop vehicles or Suspended/Expired drivers from dispatch lists.
  - Prevents vehicle double-scheduling (fails dispatch if vehicle/driver is already `On Trip`).
  - Restricts dispatches exceeding maximum load capacity.
- **State Machine Automation**:
  - Dispatching sets vehicle/driver to `On Trip`.
  - Completing sets them back to `Available`, logs fuel consumption, and updates the vehicle's odometer.
  - Starting maintenance shifts vehicle to `In Shop` (locking it from trips), closing it restores it to `Available` and registers the maintenance expense.
- **Reporting & Downloads**: Consolidated reports (Fleet Utilization, Cost & ROI, fuel efficiency, maintenance summary) with instant client-side CSV (PapaParse) and PDF (jsPDF) download controls.
- **Global Search & Command Palette**: Press `Ctrl + K` (or `Cmd + K`) anywhere to open a global search command palette querying across all active vehicles, drivers, trips, and expenses concurrently.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 15+ (App Router), React 19, Tailwind CSS v4, Lucide Icons, next-themes (Light/Dark support).
- **State & Forms**: TanStack Query, React Hook Form, Zod schemas (validates both client inputs and API boundaries).
- **Backend & Database**: Next.js Route Handlers + Server Actions, MongoDB Atlas, Mongoose (ODM).
- **Security**: bcryptjs password hashing, JWT session encoding, custom RBAC route guard middleware.
- **Export Utility**: PapaParse (CSV), jsPDF (PDF layouts).

---

## 🚀 Getting Started

### 1. Configure Environment Variables
Copy `.env.example` to `.env` (or `.env.local`):
```bash
cp .env.example .env
```

Ensure the variables are set:
- `MONGODB_URI`: Your MongoDB connection string (local or Atlas cluster).
- `NEXTAUTH_SECRET`: A secure 32-character secret key.

### 2. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Access Accounts

You can click any demo account on the sign-in page to instantly autofill credentials.

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@transitops.com` | `password123` |
| **Fleet Manager** | `manager@transitops.com` | `password123` |
| **Dispatcher** | `dispatcher@transitops.com` | `password123` |
| **Safety Officer** | `safety@transitops.com` | `password123` |
| **Financial Analyst** | `finance@transitops.com` | `password123` |

Once logged in, go to **Settings** and click the **Seed / Reset Database** button to populate default vehicles, drivers, and expenses data immediately.
.
