# 🎓 Student & Viva Q&A Guide
## Event & Venue Booking Management System

This guide is designed to help you understand every part of the codebase, explain your project with confidence, and easily answer questions from professors, lab instructors, or evaluators.

---

## 🏛️ 1. High-Level Architecture: What is MVC?

This project follows the industry-standard **Model-View-Controller (MVC)** architectural pattern:

```
          HTTP Request (e.g. GET /venues)
                    │
                    ▼
           ┌─────────────────┐
           │     ROUTER      │  (routes/venueRoutes.js)
           └────────┬────────┘
                    │
                    ▼
           ┌─────────────────┐
           │   CONTROLLER    │  (controllers/venueController.js)
           └──┬───────────┬──┘
              │           │
      Queries │           │ Passes Data
              ▼           ▼
       ┌──────────┐   ┌──────────┐
       │  MODEL   │   │   VIEW   │
       │ (MongoDB)│   │  (EJS)   │
       └──────────┘   └──────────┘
```

1. **Model (`models/`)**: Represents our data and communicates with MongoDB using Mongoose.
   - `models/User.js`: User accounts (Organiser, Admin), handles password hashing with bcrypt.
   - `models/Venue.js`: Venues, seating capacity, facilities, and maintenance blocks.
   - `models/Booking.js`: Event reservations, time slots, approval status, and cost.

2. **View (`views/`)**: What the user sees on their screen, built with EJS (Embedded JavaScript) templates.
   - EJS lets us inject variables from the controller into HTML using `<%= variable %>`.

3. **Controller (`controllers/`)**: The brains of the app. It receives the request, asks the Model for data, performs validation/logic, and passes data to the View using `res.render('viewName', { data })`.

---

## ⏱️ 2. How Overlap Prevention Works (The Math Formula)

### The Question Evaluators Ask:
> *"How do you prevent two events from being booked at the same venue at the same time?"*

### Your Answer:
In `controllers/bookingController.js`, we convert times (like `"10:30"`) into **minutes since midnight** using:
```javascript
const timeToMinutes = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};
```

Two time intervals `[start1, end1]` and `[start2, end2]` overlap **if and only if**:
$$\text{start1} < \text{end2} \quad \text{AND} \quad \text{end1} > \text{start2}$$

```javascript
const isOverlapping = (start1, end1, start2, end2) => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && e1 > s2;
};
```

### Example:
- **Existing Event**: 10:00 to 14:00 (600 mins to 840 mins)
- **New Request**: 12:00 to 15:00 (720 mins to 900 mins)
- `600 < 900` (True) AND `840 > 720` (True) $\rightarrow$ **Overlap Detected!**

We run this check against:
1. All **Maintenance Blocks** scheduled by the admin on that date.
2. All **Approved** and **Pending** bookings for that venue on that date.

---

## 💡 3. How the Stretch Goal (Smart Auto-Suggestions) Works

### The Question Evaluators Ask:
> *"What happens when a requested slot is unavailable? Did you complete the stretch goal?"*

### Your Answer:
> *"Yes! Instead of just throwing an error, our application runs an intelligent auto-allocation algorithm and renders `views/bookings/conflict.ejs` with two smart solutions:"*

1. **Option A (Alternative Free Slots on the Same Venue)**:
   - The controller checks standard campus time blocks (`08:00-11:00`, `11:00-14:00`, `14:00-17:00`, `17:00-20:00`, `20:00-22:00`).
   - Any slot that has zero overlaps with existing bookings and maintenance blocks is offered with a **1-click booking button**.

2. **Option B (Alternative Available Venues for the Same Slot)**:
   - The controller queries MongoDB for all other campus venues where `capacity >= expectedAttendees`.
   - It checks whether each alternative venue is free during the requested start and end time.
   - Any free venue is displayed with its capacity, amenities, estimated cost, and a **1-click booking button**.

---

## 🔒 4. How Authentication & Sessions Work

### The Question Evaluators Ask:
> *"How do you store passwords? How does the server know who is logged in?"*

### Your Answer:
1. **Password Hashing (bcrypt)**:
   - In `models/User.js`, before saving a user, Mongoose's `pre('save')` hook runs `bcrypt.hash()`.
   - Plain text passwords are **never** stored in the database.
   - When logging in, `bcrypt.compare()` verifies the entered password against the hash.

2. **Session Cookies (`express-session`)**:
   - When a user logs in, the server creates a session in memory/database and assigns an encrypted session ID stored in the user's browser cookie.
   - For every subsequent request, the cookie is sent automatically.
   - The `middleware/auth.js` helper `bindUserToLocals` extracts `req.session.user` and exposes it to all EJS templates as `currentUser`.

---

## 🛠️ 5. What Does Each Important File Do?

| File | What It Does |
|---|---|
| `server.js` | Entry point: sets up Express, EJS engine, sessions, routes, and port |
| `config/db.js` | Connects Node.js to MongoDB using Mongoose |
| `config/seed.js` | Auto-populates 5 sample venues and 2 demo accounts on first run |
| `middleware/auth.js` | Protects routes (`isAuthenticated`, `isAdmin`, `isOrganizer`) |
| `models/User.js` | User schema with bcrypt password hashing |
| `models/Venue.js` | Venue schema with capacity, facilities, and maintenance blocks |
| `models/Booking.js` | Event reservation schema with status lifecycle |
| `controllers/bookingController.js` | Handles booking requests, conflict detection, and stretch goal |
| `controllers/dashboardController.js` | Calculates revenue, today's events, and venue utilization |
| `views/bookings/conflict.ejs` | Displays collision warning and smart alternative recommendations |

---

## 📋 6. Step-by-Step Walkthrough to Show Your Evaluator

1. **Open the app**: Visit `http://localhost:3000/login`.
2. **Show Admin Role**:
   - Click **🛡️ Admin Login** (`admin@campus.edu`).
   - Show the **Dashboard**: Point out **Today's Events**, **Venue-wise Utilisation %**, **Total Revenue (₹)**, and **Pending Approvals**.
   - Show **Venue Management**: Navigate to `/venues/new` to show venue creation, or inspect an existing venue to demonstrate **Maintenance Blocking**.
3. **Show Organiser Role**:
   - Click **Sign Out** and click **📅 Organiser Login** (`organizer@campus.edu`).
   - Show **Venue Filtering**: Go to `/venues`, type a keyword, filter by minimum capacity (e.g. `100`), and check facilities like `Stage`.
   - Show **Booking Request**: Open a venue, select date/time, point out the **live duration and cost calculator**.
4. **Demonstrate the Stretch Goal Conflict Resolver**:
   - Try to book an overlapping slot (e.g., Grand Central Auditorium today between `12:00` and `14:00`).
   - Show how the system intercepts the collision, explains the conflict reason, and auto-suggests free slots on that venue and alternative available venues on campus!
