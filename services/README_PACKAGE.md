
# Amazon PPC Optimizer Dashboard - Complete Package

## 📦 Package Contents

This is the complete, production-ready Amazon PPC Optimizer Dashboard. Everything you need to deploy and run your own PPC management system.

### What's Included:

✅ **Complete Next.js Application**
- Full source code with TypeScript
- All UI components (shadcn/ui)
- API routes for Amazon Advertising API
- Authentication system (NextAuth.js)
- Database schema (Prisma ORM)

✅ **Dashboard Features**
- Campaign overview & management (253+ campaigns)
- Keyword tracking & optimization
- Performance analytics with charts
- Historical data with date filtering
- Automated optimization controls
- Real-time Amazon API integration

✅ **Ready to Deploy**
- Vercel-ready configuration
- Docker support
- Environment templates
- Complete documentation

---

## 🚀 Quick Start (5 Minutes)

### 1. Extract the Package
```bash
unzip amazon_ppc_dashboard_complete.zip
cd amazon_ppc_dashboard/nextjs_space
```

### 2. Install Dependencies
```bash
yarn install
```

### 3. Configure Environment
Create `.env` file:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/amazon_ppc"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Amazon API (optional - can configure via UI)
AMAZON_CLIENT_ID="your-client-id"
AMAZON_CLIENT_SECRET="your-client-secret"
AMAZON_REFRESH_TOKEN="your-refresh-token"
AMAZON_PROFILE_ID="your-profile-id"
```

### 4. Initialize Database
```bash
yarn prisma generate
yarn prisma db push
```

### 5. Start Development Server
```bash
yarn dev
```

Visit **http://localhost:3000**

### 6. Login with Default Credentials
- **Email**: admin@amazon-ppc.com
- **Password**: ppcadmin123

⚠️ **Change these immediately after first login!**

---

## 📋 Prerequisites

- **Node.js** 18+ or 20+
- **PostgreSQL** database (local or cloud)
- **Amazon Advertising API** credentials
- **Yarn** package manager

### Installing Prerequisites:

**Node.js:**
- Download from [nodejs.org](https://nodejs.org/)
- Verify: `node -v` (should show v18 or higher)

**PostgreSQL:**
- **Mac**: `brew install postgresql`
- **Ubuntu**: `sudo apt install postgresql`
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/)

**Yarn:**
```bash
npm install -g yarn
```

---

## 🏗️ Project Structure

```
amazon_ppc_dashboard/nextjs_space/
│
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── campaigns/            # Campaign management
│   │   ├── dashboard/            # Dashboard APIs
│   │   ├── analytics/            # Analytics data
│   │   ├── history/              # Optimization history
│   │   └── settings/             # Settings management
│   │
│   ├── dashboard/                # Dashboard Pages
│   │   ├── page.tsx             # Overview dashboard
│   │   ├── campaigns/           # Campaigns page
│   │   ├── keywords/            # Keywords page  
│   │   ├── analytics/           # Analytics page
│   │   ├── history/             # History page
│   │   ├── controls/            # Controls page
│   │   └── settings/            # Settings page
│   │
│   ├── auth/                     # Auth Pages
│   │   ├── signin/              # Login page
│   │   └── signup/              # Registration page
│   │
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles
│
├── components/                   # React Components
│   ├── dashboard/               # Dashboard-specific
│   ├── ui/                      # shadcn/ui components
│   └── providers/               # Context providers
│
├── lib/                          # Utilities & Config
│   ├── db.ts                    # Prisma client
│   ├── auth.ts                  # Auth configuration
│   ├── amazon-ads-api.ts        # Amazon API client
│   ├── types.ts                 # TypeScript types
│   └── utils.ts                 # Helper functions
│
├── prisma/                       # Database
│   └── schema.prisma            # Database schema
│
├── public/                       # Static Assets
│   └── favicon.svg              # Favicon
│
├── .env                          # Environment variables
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts           # Tailwind config
└── next.config.js               # Next.js config
```

---

## 🔧 Configuration

### Environment Variables

The `.env` file controls all configuration:

```env
# Database Connection
DATABASE_URL="postgresql://user:password@host:5432/database"
# Local example: postgresql://postgres:postgres@localhost:5432/amazon_ppc
# Hosted example: postgresql://user:pass@host.provider.com:5432/db

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
# Production: https://your-domain.com

NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
# Generate: openssl rand -base64 32

# Amazon Advertising API (Optional - can configure via Settings page)
AMAZON_CLIENT_ID="amzn1.application-oa2-client.xxxxx"
AMAZON_CLIENT_SECRET="your-client-secret"
AMAZON_REFRESH_TOKEN="Atzr|IwEBIxxxx"
AMAZON_PROFILE_ID="1234567890"
```

### Amazon API Credentials

You have 3 options to configure Amazon API:

1. **Via Settings UI** (Recommended)
   - Login to dashboard
   - Go to Settings page
   - Enter credentials
   - Click Save

2. **Via Environment Variables**
   - Add to `.env` file as shown above

3. **Via Credentials File**
   - Create `~/amazon_ads_credentials.json`:
   ```json
   {
     "client_id": "amzn1.application-oa2-client.xxxxx",
     "client_secret": "your-secret",
     "access_token": "Atza|xxxxx",
     "refresh_token": "Atzr|xxxxx",
     "profile_id": "1234567890"
   }
   ```

---

## 🌐 Deployment

### Vercel (Easiest - Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd amazon_ppc_dashboard/nextjs_space
   vercel
   ```

4. **Configure Environment Variables**
   - Go to vercel.com → Your Project → Settings
   - Add all variables from `.env`
   - Redeploy

### Docker

1. **Create Dockerfile** in `nextjs_space/`:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package.json yarn.lock ./
   RUN yarn install --frozen-lockfile
   COPY . .
   RUN yarn prisma generate
   RUN yarn build
   EXPOSE 3000
   CMD ["yarn", "start"]
   ```

2. **Build & Run**
   ```bash
   docker build -t amazon-ppc-dashboard .
   docker run -p 3000:3000 --env-file .env amazon-ppc-dashboard
   ```

### Traditional VPS (AWS EC2, DigitalOcean, etc.)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2 yarn

# Deploy app
cd /path/to/amazon_ppc_dashboard/nextjs_space
yarn install
yarn prisma generate
yarn build

# Start with PM2
pm2 start yarn --name "ppc-dashboard" -- start
pm2 startup
pm2 save
```

---

## 📊 Features Overview

### Dashboard Overview
- Real-time campaign performance metrics
- ACOS tracking and trends
- Spend and sales overview
- Recent optimization actions
- Quick stats at a glance

### Campaigns Management
- View all 253+ Sponsored Products campaigns
- Filter by status (enabled/paused)
- Performance metrics per campaign
- Quick actions (pause/enable campaigns)
- Sync directly from Amazon API
- Campaign search and sorting

### Keywords Tracking
- Complete keyword inventory
- Performance metrics (ACOS, spend, sales, clicks)
- Filter by status and match type
- Bid tracking
- Conversion monitoring
- Match type analysis (exact/phrase/broad)

### Analytics
- Historical performance data
- Custom date range filtering
- Trigger type analysis
- Performance trends
- Visual charts and graphs
- Export capabilities

### Controls & Automation
- Configure ACOS thresholds
- Set bid adjustment rules
- Campaign activation/deactivation rules
- Budget management settings
- Automated optimization triggers

### History
- Complete optimization action log
- Date-based filtering
- Action details and outcomes
- Performance impact tracking
- Audit trail

### Settings
- Amazon API configuration
- Account management
- Change password
- Threshold customization
- Notification preferences

---

## 🔍 Troubleshooting

### Build Issues

**Problem**: TypeScript errors during build
```bash
# Solution
yarn tsc --noEmit  # Check for errors
rm -rf .next       # Clear build cache
yarn install       # Reinstall dependencies
yarn build         # Try again
```

**Problem**: Module not found
```bash
# Solution
rm -rf node_modules
yarn install
```

### Database Issues

**Problem**: Can't connect to database
```bash
# Solution
# 1. Verify PostgreSQL is running
sudo service postgresql status  # Linux
brew services list              # Mac

# 2. Test connection
psql "postgresql://user:pass@host:5432/db"

# 3. Check DATABASE_URL in .env
# 4. Ensure database exists
# 5. Run migrations
yarn prisma db push
```

**Problem**: Prisma client not generated
```bash
# Solution
yarn prisma generate
```

### API Issues

**Problem**: Amazon API errors (401, 403)
```bash
# Solutions
# 1. Check if access token is expired
# 2. Verify client ID and secret
# 3. Ensure profile ID is correct
# 4. Use refresh token to get new access token
```

**Problem**: Rate limiting (425 errors)
```bash
# Solution
# The dashboard implements automatic caching
# Wait 60 seconds between API calls
# Check Amazon API rate limits in Settings
```

### Runtime Issues

**Problem**: Port 3000 already in use
```bash
# Solution
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 yarn dev
```

**Problem**: App crashes on start
```bash
# Solution
# Check logs
yarn dev  # See error messages

# Common fixes:
# 1. Verify all environment variables are set
# 2. Check database connection
# 3. Ensure Node.js version is 18+
# 4. Clear cache: rm -rf .next
```

---

## 🔒 Security Best Practices

- ✅ **Change default credentials** immediately after first login
- ✅ **Generate strong NEXTAUTH_SECRET** using `openssl rand -base64 32`
- ✅ **Enable HTTPS** in production (use Let's Encrypt/Certbot)
- ✅ **Keep dependencies updated** regularly with `yarn upgrade`
- ✅ **Never commit `.env`** to version control
- ✅ **Use environment variables** for all secrets
- ✅ **Implement rate limiting** for public APIs
- ✅ **Regular database backups** (daily recommended)
- ✅ **Monitor application logs** for suspicious activity
- ✅ **Use strong passwords** for all accounts
- ✅ **Configure firewall rules** properly
- ✅ **Keep Node.js updated** to latest LTS version

---

## 📖 Additional Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **Prisma Documentation**: https://www.prisma.io/docs
- **Amazon Advertising API**: https://advertising.amazon.com/API/docs
- **NextAuth.js**: https://next-auth.js.org
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com

---

## 💾 Backup & Maintenance

### Database Backups

```bash
# Backup
pg_dump -U username -h hostname database > backup_$(date +%Y%m%d).sql

# Restore
psql -U username -h hostname database < backup_20251011.sql

# Automated backup script
#!/bin/bash
pg_dump DATABASE_URL > /backups/ppc_$(date +%Y%m%d_%H%M%S).sql
find /backups -name "ppc_*.sql" -mtime +7 -delete  # Keep 7 days
```

### Application Updates

```bash
# Update dependencies
yarn upgrade-interactive

# Update specific package
yarn upgrade next@latest

# Check for outdated packages
yarn outdated
```

---

## 📊 Performance Optimization

- **Enable caching** for API responses (built-in)
- **Use CDN** for static assets (automatic with Vercel)
- **Database indexing** (included in schema)
- **Connection pooling** for database
- **Image optimization** (Next.js automatic)
- **Code splitting** (Next.js automatic)
- **Compression** enabled by default

---

## 🆘 Support & Help

### Common Questions

**Q: How do I add more users?**
A: Use the signup page or create users via API/database

**Q: Can I customize the ACOS thresholds?**
A: Yes, go to Controls page to set custom thresholds

**Q: How often does data sync from Amazon?**
A: Data syncs on-demand or via API calls (implement cron for automatic)

**Q: Can I export data?**
A: Yes, use the export functions in Analytics page

**Q: Is my data secure?**
A: Yes - uses industry-standard encryption, but ensure you follow security best practices

### Getting Help

1. Check this README thoroughly
2. Review application logs: `yarn dev` (development) or `pm2 logs` (production)
3. Check database logs for connection issues
4. Verify all environment variables are set correctly
5. Test Amazon API credentials separately

---

## 📝 Version History

**Version 1.0.0** (October 11, 2025)
- Initial release
- Campaign management for 253+ campaigns
- Keyword tracking and optimization
- Performance analytics with date filtering
- Historical data logging
- Amazon Advertising API integration
- Automated optimization controls
- Authentication system
- Responsive dashboard UI

---

## 📄 License

**Proprietary Software** - All rights reserved

This package is provided for use as-is. Modify and customize as needed for your Amazon PPC optimization needs.

---

## 🙏 Credits

Built with:
- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma ORM
- NextAuth.js
- PostgreSQL

---

## ✨ Final Notes

This is a production-ready, fully-functional Amazon PPC optimization dashboard. All features are working and connected to real Amazon Advertising API data.

**What makes this special:**
- ✅ Handles 253+ campaigns efficiently
- ✅ Real-time data from Amazon API
- ✅ Beautiful, responsive UI
- ✅ Complete authentication system
- ✅ Historical data tracking
- ✅ Automated optimization capabilities
- ✅ Production-tested and deployed

**Deployed Version**: https://amazon-ppc-dashboard-ak81x3.abacusai.app

Enjoy optimizing your Amazon PPC campaigns! 🚀

---

For issues or questions, refer to the inline code comments and API documentation.

**Happy Optimizing!** 🎯
