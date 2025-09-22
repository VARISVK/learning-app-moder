# Deployment Guide

## Quick Deploy Options

### Option 1: Railway (Recommended - Free Tier Available)
1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add PostgreSQL database:
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically set `DATABASE_URL` environment variable
6. Deploy! Your app will be live at `https://your-app-name.railway.app`

### Option 2: Render (Free Tier Available)
1. Go to [Render.com](https://render.com)
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Add PostgreSQL database:
   - Click "New" → "PostgreSQL"
   - Copy the connection string
6. In your web service settings:
   - Build Command: `npm install`
   - Start Command: `npm run server`
   - Add environment variable: `DATABASE_URL` = your PostgreSQL connection string
7. Deploy!

### Option 3: Heroku (Paid)
1. Install Heroku CLI
2. `heroku create your-app-name`
3. `heroku addons:create heroku-postgresql:hobby-dev`
4. `git push heroku main`

## Environment Variables

The app automatically detects the environment:
- **Local Development**: Uses mock database (no setup needed)
- **Production**: Uses PostgreSQL when `DATABASE_URL` is set

## Testing the Deployment

1. Register a new account on your deployed app
2. Login with those credentials
3. Test all features:
   - Dashboard
   - Study Partner matching
   - Wallet functionality
   - WebRTC screen sharing

## Database Schema

The app automatically creates the required tables on first run:
- `users` - User accounts and profiles
- `transactions` - Wallet transaction history
- `study_sessions` - Study session records

## Troubleshooting

- Check logs in your hosting platform's dashboard
- Ensure `DATABASE_URL` is properly set
- Verify all dependencies are installed
- Check that port 3001 is accessible (or use platform's assigned port)
