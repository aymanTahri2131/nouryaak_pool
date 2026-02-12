# Database Schema Architecture

This document details the MongoDB schema structure for the **Aronium aroPos** system. The system uses Mongoose for object modeling and maintains a strict typing system.

---

## 👤 User Management
### **User**
Manages authentication and access control.
- `name`: Full name of the user.
- `email`: unique identifier for login.
- `password`: Hashed password (bcrypt).
- `pin`: 4-digit PIN for quick POS access.
- `role`: `admin` | `waiter` | `bartender` | `pool_manager`.
- `isActive`: Boolean flag for account status.

---

## 📦 Inventory & Menu
### **Category**
Product groupings for easy navigation.
- `name`: Default category name.
- `nameEn`, `nameFr`, `nameAr`: Localized names.
- `aroniumId`: ID linked to the Aronium backend.

### **Product**
Individual menu items linked to categories.
- `name`: Default product name.
- `nameEn`, `nameFr`, `nameAr`: Localized names.
- `price`: Unit price.
- `categoryId`: Reference to `Category`.
- `aroniumId`: Sync ID from Aronium.
- `hasSugar`: flag for beverage customization.
- `options`: Array of strings for product variants.

---

## 🍽️ Table Management
### **CafeTable**
Tables for restaurant/cafe service.
- `number`: Unique table identifier.
- `status`: `available` | `occupied` | `reserved`.
- `currentOrderTotal`: Total of all active orders on this table.

### **PoolTable**
Dedicated tables for billiards.
- `number`: Unique table identifier.
- `status`: `available` | `occupied` | `maintenance`.
- `currentSessionId`: Reference to an active `PoolSession`.

---

## 🛒 Transactional Data
### **Order** (Cafe/Restaurant)
- `orderNumber`: Unique sequential ID (`ORD-YYYYMMDD-XXXX`).
- `tableId`: Reference to `CafeTable`.
- `waiterId`: Reference to `User`.
- `status`: `new` | `preparing` | `ready` | `served` | `paid`.
- `items`: Sub-schema containing `productId`, `quantity`, `unitPrice`, and customizations (`sugar`, `notes`).
- `total`: Automatically calculated sum of all items.
- `exportedToAronium`: Flag for financial sync.

### **PoolSession**
- `tableId`: Reference to `PoolTable`.
- `type`: `pieces` | `challenge`.
- `pieces`: Array of `count` and `playerName` for piece-based games.
- `challenge`: Sub-schema for matches (player names, scores, mode).
- `totalCost`: Calculated based on time/pieces/games.
- `isPaid`: Session closure flag.
- `tournamentId`: Optional reference to `PoolTournament`.

---

## 🏆 Competition
### **PoolTournament**
- `name`: Tournament title.
- `status`: `draft` | `pending` | `in_progress` | `completed`.
- `players`: Array of player names.
- `tableIds`: Array of specific `PoolTable` IDs assigned to the tournament.
- `matches`: Complex array tracking bracket progression:
    - `round`: Tournament stage.
    - `player1Name`, `player2Name`: Match participants.
    - `winnerName`: Winner of the match.
    - `sessionId`: Link to the match's `PoolSession`.
    - `nextMatchId`: Linkage for automatic bracket advancement.

---

## 🔄 System Integrity
### **SyncStatus**
Tracks the state of synchronization with the Aronium database to ensure data consistency across the network.
