# Deployment Guide (Hostinger VPS)

This project uses Docker for deployment. It consists of:
*   **Backend**: Node.js API (Port 5000 internal)
*   **Frontend**: React + Vite + Nginx (Port 80 internal)
*   **Proxy**: Exposed via Docker Compose on Port 8080.

## 1. Initial VPS Setup
1.  Access your VPS via SSH (`ssh root@YOUR_IP`).
2.  Run the setup script to install Docker, Nginx, and Git:
    ```bash
    # Create the script
    nano setup.sh
    # Paste contents from local file: scripts/setup.sh
    
    # Run it
    bash setup.sh
    ```

## 2. Deploy Code
1.  Clone the repository:
    ```bash
    mkdir -p /var/www
    cd /var/www
    git clone https://github.com/YOUR_GITHUB_USERNAME/billing_sys_rkct.git
    cd billing_sys_rkct
    ```

2.  Configure Environment:
    ```bash
    cp src/backend/.env.example src/backend/.env
    nano src/backend/.env
    ```
    *   Set `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (Hostinger MySQL details).
    *   Set `PORT=5000` (Internal port, don't change).
    *   Set `FRONTEND_URL=https://billing.rkcasting.in`.

3.  Start Services:
    ```bash
    docker compose up -d --build
    ```
    *   The app is now running on `http://localhost:8080`.

## 3. Configure Domain & SSL
We use the host's Nginx to handle SSL and reverse proxy to Docker.

1.  Create Nginx Config:
    ```bash
    nano /etc/nginx/sites-available/billing
    ```
    Paste this:
    ```nginx
    server {
        server_name billing.rkcasting.in; 

        location / {
            proxy_pass http://localhost:8080;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

2.  Enable Site:
    ```bash
    ln -s /etc/nginx/sites-available/billing /etc/nginx/sites-enabled/
    nginx -t
    systemctl restart nginx
    ```

3.  Get SSL Certificate:
    ```bash
    certbot --nginx -d billing.rkcasting.in
    ```

## 4. Updates
To deploy new changes:
```bash
cd /var/www/billing_sys_rkct
git pull
docker compose up -d --build
```
