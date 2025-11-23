# Docker Deployment Guide

This guide will help you deploy the Cookbook application on your home lab Ubuntu server.

## Prerequisites

- Docker and Docker Compose installed on your Ubuntu server
- Git to clone the repository
- An OpenAI API key (for the recipe stealing feature)

### Installing Docker on Ubuntu

If you don't have Docker installed yet:

```bash
# Update package index
sudo apt update

# Install Docker
sudo apt install docker.io docker-compose-v2 -y

# Add your user to the docker group (so you don't need sudo)
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect
# Or run: newgrp docker
```

## Quick Start

1. **Clone the repository**

   ```bash
   git clone <your-repo-url> cookbook
   cd cookbook
   ```

2. **Create your environment file**

   ```bash
   cp .env.example .env
   ```

3. **Edit .env and add your OpenAI API key**

   ```bash
   nano .env
   # Add your key: OPENAI_API_KEY=sk-your-actual-key
   ```

4. **Create the data directory**

   ```bash
   mkdir -p data
   ```

5. **Start the application**

   ```bash
   docker compose up -d
   ```

6. **Access the app**
   Open your browser to `http://your-server-ip:3000`

That's it! Database migrations run automatically on startup.

---

## Understanding the Setup

### Why These Files?

| File                 | Purpose                                                |
| -------------------- | ------------------------------------------------------ |
| `Dockerfile`         | Instructions to build the application container        |
| `docker-compose.yml` | Orchestrates running the container with proper config  |
| `.env`               | Your secret environment variables (never commit this!) |
| `.env.example`       | Template showing required variables                    |
| `.dockerignore`      | Files to exclude from Docker build (speeds up builds)  |

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                     Your Ubuntu Server                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Docker Container (cookbook)                │ │
│  │                                                         │ │
│  │   Node.js App ──────► Port 3000                        │ │
│  │        │                                                │ │
│  │        ▼                                                │ │
│  │   /app/data/cookbook.db                                │ │
│  │        │                                                │ │
│  └────────│────────────────────────────────────────────────┘ │
│           │ (volume mount)                                   │
│           ▼                                                  │
│   ./data/cookbook.db  ◄── Your data persists here!          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Persistence

Your SQLite database is stored in `./data/cookbook.db` on your host machine. This means:

- **Container rebuilds won't lose data** - The database lives outside the container
- **Easy backups** - Just copy the `./data` folder
- **Easy migration** - Move the data folder to a new server

---

## Common Commands

### Starting and Stopping

```bash
# Start the app (detached mode - runs in background)
docker compose up -d

# Stop the app
docker compose down

# Restart the app
docker compose restart

# View logs
docker compose logs -f

# View logs (last 100 lines)
docker compose logs --tail 100
```

### Updating the App

When you pull new code:

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose up -d --build

# Run migrations if there are database changes
docker compose exec cookbook npm run db:migrate
```

### Database Management

```bash
# Migrations run automatically on container start
# To manually run migrations:
docker compose exec cookbook npm run db:migrate

# Open a shell in the container
docker compose exec cookbook sh

# Backup your database
cp ./data/cookbook.db ./data/cookbook.db.backup
```

### Troubleshooting

```bash
# Check if container is running
docker compose ps

# Check container health
docker inspect cookbook --format='{{.State.Health.Status}}'

# View detailed logs
docker compose logs cookbook

# Rebuild from scratch (if something is broken)
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## Why We Made These Choices

### Multi-Stage Docker Build

The Dockerfile uses two stages:

1. **Builder stage**: Installs all dependencies (including dev), compiles native modules, builds the app
2. **Runner stage**: Only copies what's needed to run - keeps the final image small (~200MB instead of ~1GB)

### Alpine Linux

We use `node:22-alpine` because:

- Alpine is tiny (~5MB base)
- Results in smaller, faster images
- Trade-off: Requires extra packages for native modules (python3, make, g++)

### better-sqlite3 Dependencies

better-sqlite3 is a native Node module (written in C++). It needs:

- **Build time**: python3, make, g++, sqlite-dev (to compile)
- **Run time**: sqlite-libs, libstdc++ (to execute)

### Non-Root User

The container runs as user `cookbook` (not root) for security. If someone exploits a vulnerability in the app, they won't have root access to the container.

### Volume Mount for Data

SQLite databases are just files. By mounting `./data:/app/data`:

- Data survives container rebuilds
- You can easily backup by copying the folder
- No need for a separate database container

---

## Production Considerations

### Reverse Proxy (Optional)

For HTTPS and custom domains, put nginx in front:

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

Example nginx config (`/etc/nginx/sites-available/cookbook`):

```nginx
server {
    server_name cookbook.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then:

```bash
sudo ln -s /etc/nginx/sites-available/cookbook /etc/nginx/sites-enabled/
sudo certbot --nginx -d cookbook.yourdomain.com
sudo systemctl reload nginx
```

### Backups

Simple backup script (`backup.sh`):

```bash
#!/bin/bash
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR
cp ./data/cookbook.db "$BACKUP_DIR/cookbook-$(date +%Y%m%d-%H%M%S).db"
# Keep only last 7 backups
ls -t $BACKUP_DIR/*.db | tail -n +8 | xargs -r rm
```

Add to crontab for daily backups:

```bash
crontab -e
# Add: 0 2 * * * /path/to/cookbook/backup.sh
```

---

## FAQ

**Q: The app won't start, what do I check?**

```bash
docker compose logs cookbook
```

Look for error messages. Common issues:

- Missing `.env` file
- Invalid OpenAI API key
- Port 3000 already in use

**Q: How do I change the port?**
Edit `docker-compose.yml`, change `"3000:3000"` to `"8080:3000"` (access on port 8080)

**Q: How do I update Node.js version?**
Edit the `FROM` lines in `Dockerfile` (e.g., `node:22-alpine` → `node:24-alpine`)

**Q: Can I run multiple instances?**
Yes, change the port and container name in `docker-compose.yml`

---

Happy cooking!
