#!/bin/bash
set -e

echo "Configuring Nginx Proxy..."

# Write config to file
# We use 'EOF' to prevent shell from expanding $host variables
cat << 'EOF' > /etc/nginx/sites-available/billing
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
EOF

# Enable the site (force link)
ln -sf /etc/nginx/sites-available/billing /etc/nginx/sites-enabled/

# Remove default Nginx site if it exists to avoid conflicts
rm -f /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Restart Nginx to apply changes
systemctl restart nginx

echo "✅ Nginx Proxy Configured Successfully!"
