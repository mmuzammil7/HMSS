# HMSS — Hostel Mess Support Software

A web-based management system for hostel administrators to track resident attendance, calculate mess bills, and monitor per-resident billing — all in one place.

---


---

## ✨ Features

- **Attendance Tracking** — Mark and manage daily attendance for hostel residents
- **Mess Bill Calculation** — Automatically calculate mess bills based on attendance records
- **Per-Resident Billing** — View and track the bill amount owed by each individual resident
- **Resident Management** — Manage hostel resident profiles and records

---

## 🛠️ Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | HTML, CSS, TypeScript / JavaScript |
| Backend    | TypeScript (Node.js)              |
| Database   | PostgreSQL (Neon)                 |
| Deployment | Replit                            |
| Package Manager | pnpm (monorepo workspace)    |

---

## 📁 Project Structure

```
HMSS/
├── api/                  # Backend API routes and handlers
├── lib/                  # Shared utilities and business logic
├── scripts/              # Helper/automation scripts
├── artifacts/            # Build or generated artifacts
├── messmate_neon_import.sql  # Database schema / seed file
├── package.json          # Root package config
├── pnpm-workspace.yaml   # Monorepo workspace config
├── tsconfig.json         # TypeScript configuration
└── tsconfig.json         # TypeScript configuration
```

---

## ⚙️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) — `npm install -g pnpm`
- A [Neon](https://neon.tech/) PostgreSQL database (or any compatible PostgreSQL instance)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mmuzammil7/HMSS.git
   cd HMSS
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up the database**

   Import the schema into your Neon (or PostgreSQL) database:
   ```bash
   psql <your-connection-string> < messmate_neon_import.sql
   ```

4. **Configure environment variables**

   Create a `.env` file in the root directory and add your database connection string:
   ```env
   DATABASE_URL=your_neon_postgresql_connection_string
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   ```

---

## 🗄️ Database

The project uses a **Neon PostgreSQL** database. The `messmate_neon_import.sql` file contains the full schema and any seed data needed to get started.

---

## 🚢 Deployment

The app is configured for deployment on **Vercel**. The `vercel.json` file handles routing and serverless function configuration.

To deploy:
```bash
vercel deploy
```

Or connect your GitHub repository to Vercel for automatic deployments on every push.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source. Feel free to use and adapt it for your own hostel management needs.

---

## 👤 Author

**Muhammad Muzammil**
- GitHub: [@mmuzammil7](https://github.com/mmuzammil7)

