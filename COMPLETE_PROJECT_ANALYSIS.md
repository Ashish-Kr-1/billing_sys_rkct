# Complete Project Analysis
### RK Casting & Engineering Works - Billing System

## 1. Executive Summary
This project is a comprehensive **Multi-Tenant Billing & Ledger System** hosted on a VPS. It consolidates financial operations for three distinct entities (RK Casting, RK Engineering, Global Bharat) into a single, unified web application. The system is built on the MERN stack (MySQL, Express, React, Node) and features a fully automated CI/CD pipeline.

## 2. Architecture & Technology Stack

### Frontend (User Interface)
*   **Framework**: **React v19** (Vite Build Tool)
*   **Routing**: **React Router Dom v7** (SPA Architecture)
*   **Styling**: **TailwindCSS** (Modern utility-first styling with gradients/animations)
*   **State Management**:
    *   **Context API**: `AuthContext` (User Sessions), `CompanyContext` (Multi-Company Selection).
    *   **Architecture**: Protected Routes enforce a flow: `Login` -> `Company Selection` -> `Dashboard`.
*   **HTTP Client**: Custom wrapper (`apiClient.js`) that automatically injects:
    *   `Authorization: Bearer <token>` (JWT)
    *   `x-company-id: <id>` (Multi-Tenancy Context)

### Backend (API & Logic)
*   **Runtime**: **Node.js** (v20-alpine container)
*   **Framework**: **Express.js** (Hybrid monolith)
*   **Architecture**:
    *   **Controllers/Routes**: Migration from monolithic `app.js` handlers to modular `controllers/`.
    *   **Middleware**: `auth.js` (JWT Validation), `app.js` global interceptor for `x-company-id`.
*   **Authentication**: JWT-based stateless auth.

### Database (Data Layer)
*   **Engine**: **MySQL** (Hosted remotely on Hostinger).
*   **Strategy**: **Multi-Database Sharding**.
    *   Instead of mixing data, the system connects to 3 distinct physical databases:
        1.  `u971268451_Billing_System` (RK Casting)
        2.  `u971268451_RkWorkBilling` (RK Engineering)
        3.  `u971268451_GlobalBilling` (Global Bharat)
*   **Connection Management**: `db.js` implements a smart `DatabaseManager` that maintains separate connection pools and hot-swaps them based on the incoming request header.

## 3. Infrastructure & Deployment

### Server
*   **Host**: Hostinger VPS (Linux/Ubuntu).
*   **Web Server**: **Nginx** (Reverse Proxy).
    *   Handles SSL termination (Let's Encrypt).
    *   Proxies `/` to Frontend Container (Port 8080).
    *   Proxies `/api/*` to Backend Container (Port 5000).

### Containerization (Docker)
*   **Orchestration**: `docker-compose.yml` manages two services:
    *   `backend`: Exposes port 5000 (Localhost only).
    *   `frontend`: Multi-stage build (Node build -> Nginx Alpine image) serving static assets on port 8080.

### CI/CD Pipeline (GitHub Actions)
*   **Workflow**: `.github/workflows/deploy_vps.yml`.
*   **Automation**:
    1.  Triggered on Push to `main`.
    2.  SSH into VPS.
    3.  `git pull` latest code.
    4.  `docker compose up -d --build` (Zero-downtime container replacement).
    5.  **Auto-Repair**: Runs `setup_nginx_proxy.sh` to patch SSL configs and restart Nginx automatically.

## 4. Key Features & Workflows

### A. Multi-Company Support
*   **User Flow**: After login, users *must* select a company. This choice persists in `localStorage`.
*   **Backend Logic**: Every API request carries this choice. The backend dynamically switches the database connection pool *per request*. This ensures data isolation and "3-apps-in-1" functionality.

### B. Ledger & Financials
*   **Dynamic Ledger**: Real-time fetching of credits/debits.
*   **Invoicing**: Full CRUD for invoices (`createInvoice` endpoint).
*   **Payment Tracking**: Records partial payments against invoices (`/ledger/payment`).
*   **Preview Generation**: Sophisticated invoice preview before printing.

### C. Security
*   **Network**: Backend API port (5000) is bound to `127.0.0.1`, forcing all traffic through the secured Nginx proxy.
*   **Auth**: Token-based (JWT). Protected Routes prevent unauthorized access.
*   **Validation**: Backend validator middleware ensures data integrity.

## 5. Deployment Status (As of Analysis)
*   **Status**: **Healthy & Automated**.
*   ** Recent Critical Fix**: The backend container port was previously isolated. It is now exposed locally, bridging the connectivity gap between the Host Nginx and the Docker Network. The deployment pipeline now auto-heals Nginx configurations.

This system is robust, modern, and built for scale.
