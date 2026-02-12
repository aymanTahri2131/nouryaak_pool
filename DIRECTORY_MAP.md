# Project Directory Map

This document provides a comprehensive map of the **Aronium aroPos** folders and files structure.

---

## 📁 Root Directory
- `backend/`: Core backend logic (Node.js/Express).
- `public/`: Static assets (Logos, Icons).
- `src/`: Frontend source code (React/Vite).
- `ARCHITECTURE.md`: High-level architecture documentation.
- `SCHEMAS.md`: Database schema documentation.
- `package.json`: Main project dependencies and scripts.
- `tailwind.config.ts`: UI styling configuration.

---

## 🌐 Frontend Structure (`/src`)

### **📄 Pages (`/src/pages`)**
- `Login.tsx`: User authentication.
- `CafeTables.tsx`: Overview of all restaurant tables.
- `TableDetail.tsx`: Detailed order management for a specific table.
- `PoolTables.tsx`: Management of billiard tables and active sessions.
- `PoolManagement.tsx`: Configuration for pool prizes and modes.
- `BartenderView.tsx`: Preparation queue for drinks and food.
- `ProductsManagement.tsx`: Menu and inventory administration.
- `UsersManagement.tsx`: User roles and permission management.
- `Reports.tsx`: Financial and session usage analytics.

### **📦 Components (`/src/components`)**
#### **POS Logic (`/src/components/pos`)**
- `TournamentDialog.tsx`: The complex bracket system and image export.
- `PoolTableCard.tsx`: Individual status card for pool tables.
- `TableCard.tsx`: Individual status card for cafe tables.
- `ProductDialog.tsx`: Modal for adding/editing products.
- `OrderPanel.tsx`: Sidebar for building active orders.
- `ChallengeResultDialog.tsx`: Scoring interface for pool matches.
- `UnpaidSessions.tsx`: Queue for completed but unpaid pool games.

#### **Base UI (`/src/components/ui`)**
- Standard Radix-based components (Buttons, Inputs, Dialogs, Badges).

### **🔄 Logic & Data**
- `hooks/`: API interaction logic (e.g., `useTournaments.ts`, `useOrders.ts`).
- `contexts/`: Global state (e.g., `AppContext.tsx` for translations).
- `apis/`: Configurations for backend connectivity.
- `types/`: Global TypeScript definitions.

---

## 🖥️ Backend Structure (`/backend/src`)

### **🎮 Controllers (`/backend/src/controllers`)**
- `orders.controller.ts`: Logic for creating and status-tracking orders.
- `poolTables.controller.ts`: Logic for session timing and piece counting.
- `tournament.controller.ts`: Logic for bracket progression and winners.
- `sync.controller.ts`: Handles data synchronization with Aronium SQL.

### **🛠️ Services (`/backend/src/services`)**
- `order.service.ts`: Core processing for restaurant transactions.
- `pool.service.ts`: Calculation logic for billiard costs.
- `tournament.service.ts`: Bracket generation and match routing algorithms.
- `table.service.ts`: Global table status management.

### **🗄️ Database Definitions (`/backend/src/models`)**
- `Order.ts`, `PoolSession.ts`, `PoolTournament.ts`.
- `CafeTable.ts`, `PoolTable.ts`.
- `Product.ts`, `Category.ts`, `User.ts`.

### **🔌 Connectivity**
- `routes/`: API endpoint definitions.
- `socket/`: Real-time event emitters for live POS updates.
- `middleware/`: Auth guards and permission checks.
