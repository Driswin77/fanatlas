# FanAtlas - World Cup 2026 Global Fan Map

FanAtlas is a mobile-first, highly scalable global fan map designed for the 2026 World Cup. It allows fans from 48 nations to drop pins, upload compressed photos, and engage in "Who Owns" turf wars based on their location. 

The architecture is built from the ground up to operate entirely on **free-tier** services while maintaining startup-level performance and UX through client-side compression, intelligent caching, and cold-start mitigation.

## Tech Stack (Free Tier Optimized)
- **Frontend**: React (Vite), Tailwind CSS, React Leaflet, Framer Motion
- **Backend**: Node.js, Express.js, Mongoose
- **Database**: MongoDB Atlas (M0 Free Tier)
- **Caching**: Upstash Redis (Serverless Free Tier)
- **Image Hosting**: ImgBB API
- **Deployment**: Vercel (Frontend) & Render (Backend)

## Features
- **Mobile-First Glassmorphism UI**: 60fps animations, bottom sheets, and responsive side-by-side desktop layout.
- **Client-Side Image Compression**: `browser-image-compression` keeps photo uploads <500KB to save bandwidth.
- **Zero Database Bloat**: Images are uploaded directly from the client to ImgBB; only the 100-byte URL is stored in MongoDB.
- **Caching Strategy**: Upstash Redis caches global leaderboards and "Who Owns" statistics to drastically reduce MongoDB reads.
- **Cold Start Mitigation**: The frontend gracefully shows a "Waking up server" state, while a `/health` endpoint is available for automated pinging.

---

## 🚀 Setup & Deployment Guide ($0/Month)

### 1. Third-Party Account Setup
You will need API keys and URIs from these platforms:
1. **MongoDB Atlas**: Create an M0 cluster. Get the connection string (`MONGO_URI`).
2. **Upstash Redis**: Create a free Redis database. Get the connection URL (`REDIS_URL`).
3. **ImgBB**: Create a free account and get an API key (`VITE_IMGBB_API_KEY`).
4. **cron-job.org**: Create a free account (needed later for Render).

### 2. Local Development

**Backend Setup:**
```bash
cd server
npm install
cp .env.example .env
# Edit .env and add your MONGO_URI and REDIS_URL
npm start
```

**Frontend Setup:**
```bash
cd client
npm install
cp .env.example .env
# Edit .env and add your VITE_IMGBB_API_KEY
npm run dev
```

### 3. Deployment

#### Frontend (Vercel)
1. Push your repository to GitHub.
2. Import the project into Vercel.
3. Set the **Framework Preset** to Vite.
4. Set the **Root Directory** to `client`.
5. Add Environment Variables:
   - `VITE_API_URL`: Your deployed Render backend URL (e.g., `https://fanatlas-api.onrender.com/api`)
   - `VITE_IMGBB_API_KEY`: Your ImgBB API key.
6. Deploy! The `vercel.json` ensures React Router works correctly.

#### Backend (Render)
1. Create a new "Web Service" on Render.
2. Connect your GitHub repository.
3. Set the **Root Directory** to `server`.
4. The `render.yaml` file should automatically configure the build and start commands. If doing manually:
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Add Environment Variables:
   - `MONGO_URI`: Your MongoDB connection string.
   - `REDIS_URL`: Your Upstash Redis URL.
   - `CLIENT_URL`: Your deployed Vercel frontend URL (for CORS).

### 4. Keeping Render Awake (Crucial for Free Tier)
Render's free tier spins down the backend after 15 minutes of inactivity, causing a 30-50s delay on the next request.
1. Go to [cron-job.org](https://cron-job.org).
2. Create a new cron job.
3. URL: `https://<YOUR-RENDER-APP>.onrender.com/health`
4. Schedule: Every 10 minutes.
5. This ensures your backend never sleeps, providing instant responses to users.

---

## Architectural Decisions & "The Why"
- **Client-Side Compression**: Why not compress on the backend? Sending huge 10MB phone photos to a free-tier Render instance will exhaust RAM/Bandwidth fast. Compressing on the client offloads the compute work to the user's phone.
- **Why ImgBB over Cloudinary?**: ImgBB allows simple API-key based uploads without needing server-side signatures for free, completely decoupling the backend from image bandwidth.
- **Caching**: The `/api/leaderboard/global` endpoint is cached via Upstash Redis for 30s. If 1,000 users load the app simultaneously, the database is queried only *once*.
- **Database Indexes**: `location` has a `2dsphere` index, allowing `$geoWithin` queries to be blazing fast and use minimal memory. `team` and `district` are indexed for fast aggregations in the "Who Owns" endpoint.
