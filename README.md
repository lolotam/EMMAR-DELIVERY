# EMAR Delivery Management System - Deployment Guide

## 🚀 Production Deployment Guide

This guide provides comprehensive instructions for deploying the EMAR Delivery Management System in a production environment.

## 📋 Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04+ or CentOS 8+ (recommended)
- **Python**: 3.9 or higher
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 50GB+ SSD storage
- **CPU**: 2+ cores, 4+ cores recommended
- **Network**: Stable internet connection with SSL certificate

### Required Software
- Python 3.9+
- pip (Python package manager)
- Git
- Nginx (web server)
- Supervisor (process manager)
- SSL certificate (Let's Encrypt recommended)

## 🔧 Server Setup

### 1. Update System Packages

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### 2. Install Required Packages

```bash
# Ubuntu/Debian
sudo apt install -y python3 python3-pip python3-venv git nginx supervisor certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install -y python3 python3-pip git nginx supervisor certbot python3-certbot-nginx
```

### 3. Create Application User

```bash
sudo useradd -m -s /bin/bash emar
sudo usermod -aG sudo emar
```

### 4. Set Up Application Directory

```bash
sudo mkdir -p /opt/emar-delivery
sudo chown emar:emar /opt/emar-delivery
```

## 📦 Application Deployment

### 1. Clone Repository

```bash
sudo -u emar git clone https://github.com/lolotam/EMAR-DELIVERY.git /opt/emar-delivery
cd /opt/emar-delivery/emar-delivery
```

### 2. Create Virtual Environment

```bash
sudo -u emar python3 -m venv /opt/emar-delivery/venv
sudo -u emar /opt/emar-delivery/venv/bin/pip install --upgrade pip
```

### 3. Install Dependencies

```bash
sudo -u emar /opt/emar-delivery/venv/bin/pip install -r requirements.txt
```

### 4. Configure Environment Variables

```bash
sudo -u emar cp .env.example .env
sudo -u emar nano .env
```

Update the following critical settings:
```bash
FLASK_ENV=production
FLASK_SECRET_KEY=your-super-secure-secret-key-here
FLASK_USE_HTTPS=True
CSRF_SECRET_KEY=your-csrf-secret-key-here
DEFAULT_ADMIN_PASSWORD=your-secure-admin-password
```

### 5. Set Up Directory Permissions

```bash
sudo -u emar mkdir -p /opt/emar-delivery/emar-delivery/{uploads,logs,backups}
sudo chmod 755 /opt/emar-delivery/emar-delivery/uploads
sudo chmod 755 /opt/emar-delivery/emar-delivery/logs
sudo chmod 755 /opt/emar-delivery/emar-delivery/backups
```

### 6. Initialize Application

```bash
cd /opt/emar-delivery/emar-delivery
sudo -u emar /opt/emar-delivery/venv/bin/python setup_uploads.py
```

## 🔒 Security Configuration

### 1. Firewall Setup

```bash
# Ubuntu (UFW)
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. SSL Certificate Setup

```bash
# Install SSL certificate using Let's Encrypt
sudo certbot --nginx -d your-domain.com
```

### 3. Secure File Permissions

```bash
sudo chmod 600 /opt/emar-delivery/emar-delivery/.env
sudo chown emar:emar /opt/emar-delivery/emar-delivery/.env
```

## 🌐 Web Server Configuration

### 1. Nginx Configuration

Create `/etc/nginx/sites-available/emar-delivery`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL Security Headers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Main application
    location / {
        proxy_pass http://127.0.0.1:1111;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files
    location /static {
        alias /opt/emar-delivery/emar-delivery/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Upload size limit
    client_max_body_size 16M;
    
    # Logging
    access_log /var/log/nginx/emar-delivery.access.log;
    error_log /var/log/nginx/emar-delivery.error.log;
}
```

### 2. Enable Nginx Site

```bash
sudo ln -s /etc/nginx/sites-available/emar-delivery /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔄 Process Management

### 1. Gunicorn Configuration

Create `/opt/emar-delivery/emar-delivery/gunicorn.conf.py`:

```python
# Gunicorn configuration file
bind = "127.0.0.1:5000"
workers = 4
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2
max_requests = 1000
max_requests_jitter = 100
preload_app = True
user = "emar"
group = "emar"
tmp_upload_dir = None
errorlog = "/opt/emar-delivery/emar-delivery/logs/gunicorn_error.log"
accesslog = "/opt/emar-delivery/emar-delivery/logs/gunicorn_access.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'
```

### 2. Supervisor Configuration

Create `/etc/supervisor/conf.d/emar-delivery.conf`:

```ini
[program:emar-delivery]
command=/opt/emar-delivery/venv/bin/gunicorn --config /opt/emar-delivery/emar-delivery/gunicorn.conf.py app:app
directory=/opt/emar-delivery/emar-delivery
user=emar
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/opt/emar-delivery/emar-delivery/logs/supervisor.log
stdout_logfile_maxbytes=10MB
stdout_logfile_backups=5
environment=PATH="/opt/emar-delivery/venv/bin"
```

### 3. Start Services

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start emar-delivery
sudo systemctl enable supervisor
sudo systemctl enable nginx
```

## 📊 Monitoring & Logging

### 1. Log Rotation Setup

Create `/etc/logrotate.d/emar-delivery`:

```
/opt/emar-delivery/emar-delivery/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 emar emar
    postrotate
        supervisorctl restart emar-delivery
    endscript
}
```

### 2. System Monitoring

```bash
# Check application status
sudo supervisorctl status emar-delivery

# View application logs
sudo tail -f /opt/emar-delivery/emar-delivery/logs/supervisor.log

# Check Nginx status
sudo systemctl status nginx

# View Nginx logs
sudo tail -f /var/log/nginx/emar-delivery.access.log
```

## 💾 Backup Configuration

### 1. Create Backup Script

Create `/opt/emar-delivery/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/emar-delivery/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/opt/emar-delivery/emar-delivery"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup data directory
tar -czf $BACKUP_DIR/data_backup_$DATE.tar.gz -C $APP_DIR data/

# Backup uploads directory
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz -C $APP_DIR uploads/

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

### 2. Set Up Automated Backups

```bash
sudo chmod +x /opt/emar-delivery/backup.sh
sudo chown emar:emar /opt/emar-delivery/backup.sh

# Add to crontab for daily backups at 2 AM
sudo -u emar crontab -e
# Add this line:
# 0 2 * * * /opt/emar-delivery/backup.sh >> /opt/emar-delivery/emar-delivery/logs/backup.log 2>&1
```

## 🔄 Updates & Maintenance

### 1. Application Updates

```bash
# Stop the application
sudo supervisorctl stop emar-delivery

# Backup current version
sudo -u emar cp -r /opt/emar-delivery/emar-delivery /opt/emar-delivery/emar-delivery.backup.$(date +%Y%m%d)

# Pull latest changes
cd /opt/emar-delivery
sudo -u emar git pull origin main

# Update dependencies
sudo -u emar /opt/emar-delivery/venv/bin/pip install -r emar-delivery/requirements.txt

# Restart the application
sudo supervisorctl start emar-delivery
```

### 2. SSL Certificate Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Set up automatic renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🚨 Troubleshooting

### Common Issues

1. **Application won't start**
   ```bash
sudo supervisorctl tail emar-delivery
   sudo -u emar /opt/emar-delivery/venv/bin/python /opt/emar-delivery/emar-delivery/app.py
```

2. **Permission errors**
   ```bash
sudo chown -R emar:emar /opt/emar-delivery
   sudo chmod -R 755 /opt/emar-delivery/emar-delivery/uploads
```

3. **Database issues**
   ```bash
# Check data directory permissions
   ls -la /opt/emar-delivery/emar-delivery/data/
```

4. **SSL certificate issues**
   ```bash
sudo certbot certificates
   sudo nginx -t
```

### Performance Optimization

1. **Increase worker processes**
   - Edit `gunicorn.conf.py` and increase `workers` based on CPU cores

2. **Enable Nginx caching**
   - Add caching directives to Nginx configuration

3. **Monitor resource usage**
   ```bash
htop
   df -h
   free -m
```

## 📞 Support

For deployment issues or questions:
- Check the logs first: `/opt/emar-delivery/emar-delivery/logs/`
- Review Nginx logs: `/var/log/nginx/`
- Contact support: support@emar-delivery.com

---

**EMAR Delivery Management System** - Production Deployment Guidee
