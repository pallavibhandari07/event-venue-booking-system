# Event & Venue Booking Management System

A full-stack campus and community venue management web application built using **Node.js**, **Express.js**, **MongoDB (Mongoose)**, and **EJS templating**, styled with a custom dark glassmorphic design system.

---

## ⚡ Tech Stack

- **Runtime:** Node.js (v24+)
- **Backend Framework:** Express.js (v4.21+)
- **Database / ODM:** MongoDB with Mongoose (v8.10+)
- **Template Engine:** EJS
- **Session & Auth:** `express-session` & `bcryptjs`
- **Styling:** Custom Vanilla CSS Design System (CSS variables, dark glassmorphism, responsive grid)

---

## 👥 Demo Evaluator Accounts

For grading and quick evaluation, the database auto-seeds two pre-configured accounts upon first run:

| Role | Email | Password | Description |
|---|---|---|---|
| **Venue Manager / Admin** | `admin@campus.edu` | `admin123` | Full CRUD on venues, maintenance blocking, approval/rejection workflows, revenue & utilization analytics |
| **Event Organiser** | `organizer@campus.edu` | `org123` | Venue search, booking request submissions, conflict resolver, and booking history |

> [!TIP]
> **One-Click Demo Switcher:** On the `/login` page, click either **🛡️ Admin Login** or **📅 Organiser Login** to instantly sign in without typing credentials.

---

## 🌟 Features Implemented

### 1. Role-Based Authentication & Authorization
- Secure registration and login with `bcryptjs` password hashing.
- Role-specific access guards (`isAdmin`, `isOrganizer`, `isAuthenticated`).
- Dynamic navbar reflecting role privileges, user badge, and quick actions.

### 2. Admin: Venue Management & Maintenance Blocking
- **Venue CRUD:** Create, view, edit, and delete campus venues with specifications (name, capacity, facilities, hourly rate, photo URL, description).
- **Maintenance Holds:** Admin can block specific dates and time windows on any venue for repairs, calibrations, or renovations, preventing student bookings during those intervals.

### 3. Organisers: Search & Booking Workflow
- **Search & Filters:** Search by keyword, filter by minimum seating capacity, select multiple required facilities (Stage, Projector, Sound System, etc.), and filter by availability status.
- **Venue Inspection:** Date picker on venue detail pages to inspect booked schedules and maintenance blocks on any selected day.
- **Booking Requests:** Live calculation of event duration and estimated cost (`durationHours * hourlyRate`) with validation against max capacity.
- **Booking History:** Filter bookings by status (`Pending`, `Approved`, `Completed`, `Rejected`, `Cancelled`), view rejection reasons/admin notes, and cancel upcoming requests.

### 4. Overlap & Conflict Prevention Engine
- Enforces time interval overlap logic: `(newStart < existingEnd) && (newEnd > existingStart)`.
- Automatically blocks conflicting requests against approved/pending bookings or active maintenance blocks.

### 5. Stretch Goal: Smart Auto-Suggestions Engine
- When an overlap occurs, the system avoids dead-end error pages. Instead, it renders an intelligent suggestions screen:
  1. **Option A (Alternative Time Slots):** Displays candidate time slots on the *same venue* that are completely free on that date, with 1-click booking.
  2. **Option B (Alternative Venues):** Discovers other campus spaces that match the requested attendee capacity and are 100% available during the requested time slot, with 1-click booking.

### 6. Admin Booking Management Console
- Centralized approval desk with status filters (`Pending`, `Approved`, `Completed`, `Rejected`, `Cancelled`).
- One-click **Approve**, **Reject** (with required reason prompt), **Mark Completed**, or **Cancel**.

### 7. Rich Operations & Analytics Dashboard
- **Today's Events:** Live timeline of approved events happening today with organizer details, timing, and venue.
- **Upcoming Events:** Forward calendar schedule of events for the next 30 days.
- **Venue-Wise Utilisation:** Bar metrics tracking total hours booked, total bookings, and % utilization for every venue.
- **Revenue Analytics:** Real-time revenue counter from all approved and completed events, plus today's projected revenue.

---

## 🚀 Running the Project

```bash
# 1. Install dependencies
npm install

# 2. Ensure MongoDB is running
brew services start mongodb-community

# 3. Start development server (with hot reload)
npm run dev

# Or normal start
npm start
```

Access the application in your browser at:
**[http://localhost:3000](http://localhost:3000)**

---

## 📁 Directory Structure

```
Web_ass_2/
├── config/
│   ├── db.js                 # Mongoose connection & error listeners
│   └── seed.js               # Auto-seeds default venues, users & sample events
├── models/
│   ├── User.js               # User schema with bcrypt password hashing
│   ├── Venue.js              # Venue schema with capacity, facilities & maintenance blocks
│   └── Booking.js            # Booking schema with timeslots, status & cost
├── middleware/
│   └── auth.js               # Session verification & role guards
├── controllers/
│   ├── authController.js     # Login, register, logout & 1-click demo switcher
│   ├── venueController.js    # Catalog, filter, admin CRUD & maintenance
│   ├── bookingController.js  # Booking requests, conflict engine & auto-suggestions
│   ├── adminController.js    # Booking approvals, rejections & status updates
│   └── dashboardController.js# Operations analytics, revenue, utilization & today's events
├── routes/
│   ├── authRoutes.js         # /login, /register, /logout, /demo-login
│   ├── venueRoutes.js        # /venues, /venues/new, /venues/:id, /venues/:id/maintenance
│   ├── bookingRoutes.js      # /bookings, /bookings/my-bookings, /bookings/:id/cancel
│   ├── adminRoutes.js        # /admin/bookings, /admin/bookings/:id/status
│   └── indexRoutes.js        # /dashboard, /api/health
├── views/
│   ├── partials/             # Header, footer, alerts
│   ├── auth/                 # Login & Register views
│   ├── dashboard/            # Admin analytics & Organiser portal
│   ├── venues/               # Venue catalog, details, and CRUD forms
│   ├── bookings/             # Booking history, conflict suggestions, and admin list
│   └── 404.ejs               # Custom 404 page
├── public/
│   ├── css/style.css         # Modern dark glassmorphic design system
│   └── js/main.js            # Cost calculator, modal triggers, search filters
├── .env                      # Local environment configuration
└── server.js                 # Server entry point
```
