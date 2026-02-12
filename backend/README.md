# Nouryaak Pool Backend

Backend API for Nouryaak Pool - Café & Pool Management System.

## Stack Technique

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (Nouryaak Pool data) + SQLite (Aronium POS)
- **Temps réel**: Socket.io
- **Auth**: JWT + Sessions
- **Validation**: Zod

## Installation

```bash
# Installer les dépendances
npm install

# Copier et configurer .env
cp .env.example .env
# Éditer .env avec vos valeurs

# Lancer en développement
npm run dev

# Build production
npm run build
npm start
```

## Configuration (.env)

```env
# Server
NODE_ENV=development
PORT=3001

# MongoDB
MONGODB_URI=mongodb://localhost:27017/nouryaak-pool

# Redis (optionnel, pour sessions)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=votre-secret-jwt
JWT_EXPIRES_IN=7d
SESSION_SECRET=votre-secret-session

# Aronium SQLite
ARONIUM_DB_PATH=C:/Users/<user>/AppData/Local/Aronium/Data/pos.db
ARONIUM_EXPORT_ENABLED=false

# Sync automatique
SYNC_INTERVAL_MINUTES=5
AUTO_SYNC_ENABLED=true

# Frontend
CORS_ORIGIN=http://localhost:5173
```

## Scripts

```bash
npm run dev          # Développement avec hot-reload
npm run build        # Build TypeScript
npm start            # Production
npm run seed         # Peupler la base de données
```

## API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion email/password
- `POST /api/auth/pin-login` - Connexion rapide PIN
- `POST /api/auth/refresh` - Rafraîchir le token
- `GET /api/auth/me` - Profil utilisateur

### Commandes
- `GET /api/orders` - Liste des commandes
- `GET /api/orders/active` - Commandes actives
- `POST /api/orders` - Créer une commande
- `PATCH /api/orders/:id/status` - Changer le statut

### Tables Café
- `GET /api/cafe-tables` - Liste des tables
- `GET /api/cafe-tables/free` - Tables libres
- `PATCH /api/cafe-tables/:id/status` - Changer le statut

### Tables Billard
- `GET /api/pool-tables` - Liste des tables
- `POST /api/pool-tables/:id/session` - Démarrer session
- `POST /api/pool-tables/:id/session/pay` - Terminer et payer

### Produits (synchro Aronium)
- `GET /api/products` - Liste des produits
- `GET /api/products/categories` - Catégories

### Synchronisation (Admin)
- `GET /api/sync/status` - Statut de la synchro
- `POST /api/sync/all` - Synchronisation complète
- `POST /api/sync/products` - Sync produits uniquement

## Socket.io Events

### Client -> Server
- `order:subscribe` - S'abonner aux updates d'une table
- `order:getActive` - Récupérer les commandes actives
- `table:getAll` - Récupérer toutes les tables
- `pool:getLeaderboard` - Classement billard

### Server -> Client
- `order:created` - Nouvelle commande
- `order:statusChanged` - Changement de statut
- `table:statusChanged` - Table mise à jour
- `pool:sessionStarted` - Session billard démarrée

## Utilisateurs par défaut (après seed)

| Role | Email | Password | PIN |
|------|-------|----------|-----|
| Admin | admin@nouryaak-pool.local | admin123 | 0000 |
| Waiter | omar@nouryaak-pool.local | omar123 | 1111 |
| Bartender | nordine@nouryaak-pool.local | nordine123 | 2222 |
| Pool Manager | yassine@nouryaak-pool.local | yassine123 | 3333 |

## Architecture

```
backend/
├── src/
│   ├── config/        # Configuration (DB, Redis, Socket)
│   ├── models/        # Schémas MongoDB
│   ├── routes/        # Routes Express
│   ├── controllers/   # Contrôleurs
│   ├── services/      # Logique métier
│   ├── middleware/    # Auth, validation, erreurs
│   ├── aronium/       # Intégration SQLite Aronium
│   │   ├── schemas/   # Types des tables Aronium
│   │   ├── sync/      # Import depuis Aronium
│   │   └── export/    # Export vers Aronium
│   ├── socket/        # Handlers Socket.io
│   ├── jobs/          # Tâches planifiées (cron)
│   ├── validators/    # Schémas Zod
│   └── types/         # Types TypeScript
└── package.json
```

## Synchronisation Aronium

### Import (Aronium -> Nouryaak Pool)
- Produits: `Product` -> `products`
- Catégories: `ProductGroup` -> `categories`
- Tables: `FloorPlanTable` -> `cafeTables`

### Export (Nouryaak Pool -> Aronium)
- Commandes payées -> `Document` + `DocumentItem`
- Sessions billard -> `Document` (comme service)

⚠️ **Important**: Activer `ARONIUM_EXPORT_ENABLED=true` uniquement après tests.
