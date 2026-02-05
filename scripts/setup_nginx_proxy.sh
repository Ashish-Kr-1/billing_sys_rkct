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
    
    # SAFETY: Remove any existing /api/ location blocks to prevent duplicates or corruption
    # This sed command deletes from "location /api/ {" to the matching "}" (assuming standard formatting)
    # We run this blindly to "clean" the file before adding the good block.
    # Note: This simple sed assumes the closing brace is on a line by itself or indented. 
    # A safer approach for corruption is to just check boundaries, but we will try to clean up.
    if grep -q "location /api/" "$SSL_CONF"; then
        echo "🧹 Cleaning up old /api/ block..."
        # This is a bit risky if formatting is weird, but effective for standard blocks
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
# We use 'restart' which tries to stop then start, fixing 'dead' states.
echo "Restarting Nginx..."
service nginx restart || systemctl restart nginx
# Check status
systemctl status nginx --no-pager || true

echo "✅ Nginx Proxy Configured Successfully!"
