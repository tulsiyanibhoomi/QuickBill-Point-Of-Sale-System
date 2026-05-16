# ⚡ QuickBill - Point of Sale (POS) System

QuickBill is a modern, high-performance retail Point-of-Sale (POS) and inventory management system designed for stationery and electronics stores. Built with a robust **Node.js/Express** backend and a stunning **React 19 (Vite)** frontend featuring a custom dark glassmorphism UI.

## 🌐 Live Demo
### Frontend (Vercel): https://quick-bill-point-of-sale-system-sc9v-c2alz0zcw.vercel.app
### Backend API (Render): https://quickbill-point-of-sale-system-0c9q.onrender.com

⚠️ Note: If the frontend takes a little time to load initially, first open the backend API link in your browser once and wait a few seconds.
After the backend server wakes up, refresh the frontend and the app will work smoothly.

## ✨ Features

- **🛡️ Role-Based Access Control**: Strict authorization separating "Owner/Admin" (full management access) and "Worker/Cashier" (restricted to POS billing and browsing).
- **🛒 Advanced POS Counter**: Lightning-fast barcode/SKU search, cart management, variable tax rates (GST), discount handling, and multiple payment methods (Cash, UPI, Card).
- **📦 Inventory & Stock Management**: Real-time stock tracking, low-stock alerts, and an immutable audit log of all stock movements (purchases, sales, adjustments, damages).
- **🤖 AI-Powered Descriptions (Ollama)**: Automatically generates catchy, professional product and category descriptions using OpenAI free models (e.g., gpt-oss-120b:free) when adding new inventory.
- **🧾 Automated Invoicing**: Transactional sequential invoice number generation (`QB-YYYYMMDD-XXXX`) with print-ready, beautifully formatted receipts.
- **📊 Analytics Dashboard**: Comprehensive business insights including revenue trends (Recharts), category breakdowns, and top-selling products.
- **⚛️ Atomic Transactions**: MySQL ACID-compliant transactions ensure inventory is only decremented when orders and invoices are successfully generated.

## 🛠️ Technology Stack

**Frontend**

- React 19 + Vite
- React Router v7
- Axios (API Client with Interceptors)
- Recharts (Data Visualization)
- Lucide React (Iconography)
- React Hot Toast (Notifications)
- Pure Vanilla CSS (Custom Variables-driven Dark Glassmorphism Design System)

**Backend**

- Node.js + Express.js
- MySQL 8.0+ (using `mysql2/promise`)
- JSON Web Tokens (JWT) & bcryptjs
- Express Validator (Request Validation)
- Local AI Integration via Ollama HTTP API

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+ recommended)
- **MySQL** Server (running locally or remotely)
- **Ollama** (optional, for AI description generation. Running on `localhost:11434`)

### 1. Database Setup

1. Create a MySQL database (e.g., `quickbill_db`).
2. Run the provided schema file to create the tables:
   ```bash
   mysql -u root -p quickbill_db < quickbill-backend/schema.sql
   ```

### 2. Backend Configuration

1. Navigate to the backend directory:
   ```bash
   cd quickbill-backend
   npm install
   ```
2. Create a `.env` file in the `quickbill-backend` root:

   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=quickbill_db
   JWT_SECRET=super_secret_jwt_key_change_in_production

   # Store Details for Invoices
   STORE_NAME=QuickBill SuperMart
   STORE_ADDRESS=123 Retail Avenue, Tech Hub, Mumbai
   STORE_PHONE=+91 98765 43210
   STORE_GST=27AADCB2230M1Z4

   # AI Configuration (Optional)
   OLLAMA_URL=http://localhost:11434
   OLLAMA_MODEL=llama3
   ```

3. Seed the initial admin and worker accounts:
   ```bash
   npm run seed
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```

### 3. Frontend Configuration

1. Navigate to the frontend directory:
   ```bash
   cd quickbill-frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. The frontend proxy is already configured in `vite.config.js` to route `/api` requests to `http://localhost:5000`.

---

## 🧠 AI Auto-Descriptions

To use the AI generation feature, simply install [Ollama](https://ollama.com/) on your machine and pull a model (e.g., `ollama run llama3`). Ensure the Ollama service is running.

Whenever you create a new Product or Category from the QuickBill UI and leave the description blank, the Node.js backend will silently query your local LLM to draft a highly professional retail description before saving it to the database!

---

## 📝 License

This project is licensed under the ISC License. Designed and built for robust retail operations.
