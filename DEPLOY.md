# Deploy to Hostinger VPS (Docker)

This guide helps you deploy the Billing System using Docker on your VPS.

## 1. Prerequisites (One Time)
1.  **SSH into VPS**: `ssh root@YOUR_IP`
2.  **Run Setup Script**:
    ```bash
    nano setup.sh
    # Paste content from scripts/setup.sh
    bash setup.sh
    ```

## 2. Deploy Code
1.  **Clone Repo**:
    ```bash
    cd /var/www
    git clone https://github.com/Ashish-Kr-1/billing_sys_rkct.git
    cd billing_sys_rkct
    ```
2.  **Configure Environment**:
    ```bash
    cp src/backend/.env.example src/backend/.env
    nano src/backend/.env
    # Fill in DB details & FRONTEND_URL=https://billing.rkcasting.in
    ```
3.  **Start Services**:
    ```bash
    docker compose up -d --build
    ```

## 3. Configure Domain (Nginx Proxy)
1.  **Run the Helper Script**:
    ```bash
    bash scripts/setup_nginx_proxy.sh
    ```
    *This will automatically configure Nginx to point to your Docker app.*

2.  **Install SSL**:
    ```bash
    certbot --nginx -d billing.rkcasting.in
    ```

## 4. Automatic Updates
*   Push to `main` branch -> Auto-deploys to VPS via GitHub Actions.
