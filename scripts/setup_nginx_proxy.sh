# Function to generate the location block content
get_api_location_block() {
    cat <<EOF

    # API Proxy added by setup script
    location /api/ {
        # Trailing slash is CRITICAL here to strip /api/ from the request
        proxy_pass http://localhost:5000/; 
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
EOF
}

echo "Configuring Nginx Proxy..."

# 1. Configure HTTP Block (billing)
cat << 'EOF' > /etc/nginx/sites-available/billing
server {
    listen 80;
    server_name billing.rkcasting.in;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:5000/;
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

# 2. Patch SSL Block (billing-le-ssl.conf)
SSL_CONF="/etc/nginx/sites-available/billing-le-ssl.conf"

if [ -f "$SSL_CONF" ]; then
    echo "Found SSL config: $SSL_CONF"
    
    # Enable SSL site (CRITICAL FIX: Ensure it is linked)
    ln -sf "$SSL_CONF" /etc/nginx/sites-enabled/
    echo "🔗 Symlinked SSL config to sites-enabled"
    
    # SAFETY: Remove any existing /api/ location blocks to prevent duplicates or corruption
    if grep -q "location /api/" "$SSL_CONF"; then
        echo "🧹 Cleaning up old /api/ block..."
        sudo sed -i '/location \/api\/ {/,/}/d' "$SSL_CONF"
    fi

    echo "💉 Injecting fresh /api/ block..."
    
    # create temp file
    get_api_location_block > /tmp/nginx_api_block.txt
    
    # Inject BEFORE 'location / {'
    sudo sed -i '/location \/ {/e cat /tmp/nginx_api_block.txt' "$SSL_CONF"
    
    rm /tmp/nginx_api_block.txt
    echo "✅ Patched $SSL_CONF"

else
    echo "ℹ️ No SSL config found. Using HTTP only."
fi

# Remove default Nginx site
rm -f /etc/nginx/sites-enabled/default

# Test configuration
echo "Testing Nginx configuration..."
nginx -t

# RESTART Nginx (Systemctl)
echo "Restarting Nginx..."
service nginx restart || systemctl restart nginx
# Check status
systemctl status nginx --no-pager || true

echo "✅ Nginx Proxy Configured Successfully!"
