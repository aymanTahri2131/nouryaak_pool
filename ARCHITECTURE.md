# Aronium aroPos Project Architecture

This document describes the high-level architecture and file structure of the **Aronium aroPos** project.

## 🚀 Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI & Lucide Icons
- **State Management**: React Context API & TanStack Query (React Query)
- **Internationalization**: i18next (English, French, Arabic)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Real-time**: Socket.io for live table/order updates
- **Scripting**: TypeScript

---

## 📁 Directory Structure

### 🌐 Frontend (`/src`)
- `apis/`: API client configurations and endpoints.
- `components/`: Reusable UI components.
    - `pos/`: Core POS interface components (Tournament Dialog, Table Cards, etc.).
    - `ui/`: Base Shadcn/Radix UI components.
- `contexts/`: Application state providers (Auth, Theme, AppContext).
- `hooks/`: Custom React hooks and TanStack Query mutations/queries.
- `pages/`: Main application views (Dashboard, Products, Reports, Users).
- `types/`: Global TypeScript interfaces and types.
- `lib/`: Utility functions and helper classes.

### 🖥️ Backend (`/backend/src`)
- `controllers/`: Request handlers for API routes.
- `services/`: Business logic layer (Order processing, Tournament generation).
- `models/`: Mongoose schemas for MongoDB.
- `routes/`: Express route definitions.
- `middleware/`: Authentication, logging, and error handling.
- `socket/`: Socket.io event handlers for real-time synchronization.
- `seeds/`: Database initialization scripts.

---

## 🏗️ Key Systems

### 1. Tournament Management
- **Logic**: Backend handles bracket generation (Power-of-2 trees) with single-elimination.
- **Visuals**: Dynamic SVG-based bracket visualization with auto-scaling connectors.
- **Integration**: Linked to Pool Sessions; starting a match automatically allocates a table.

### 2. Multi-language/RTL Support
- **Internationalization**: Uses `i18next` with a global Translation function `t()`.
- **RTL**: Automatic Right-to-Left layout adjustment for Arabic using logical CSS properties.

### 3. Real-time Synchronization
- **WebSocket**: All POS table statuses and orders are synchronized across multiple terminals instantly using Socket.io.

### 4. Reporting & Analytics
- **Data**: Aggregated reports for daily sales, pool session revenue, and tournament performance.

---

## 🔄 Data Flow
1. **User Action**: Triggered in a React component (`/src/pages`).
2. **Hook Execution**: Custom hook uses TanStack Query to call the API (`/src/hooks`).
3. **Backend Route**: Express routes the request (`/backend/src/routes`).
4. **Controller**: Validates input and calls the Service (`/backend/src/controllers`).
5. **Service**: Executes business logic and interacts with the Model (`/backend/src/services`).
6. **Persistence**: Data saved to MongoDB via Mongoose (`/backend/src/models`).
7. **Broadcast**: Socket.io notifies other clients of the change.
