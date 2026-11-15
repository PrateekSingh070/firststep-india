# FirstStep on Vercel

Public app: https://firststep-india.vercel.app

The Vite frontend and read-only /api/jobs serverless route are hosted on Vercel. The verified public collection service and R2 storage remain on Cloudflare. Its linked cloud task refreshes data daily at 07:00 Asia/Kolkata, using its LLM to tag new or changed opportunities. No collector credentials are sent to Vercel or browsers.

Run npm ci, npm run dev, or npm run build. Vite development proxies /api/jobs to the collection service. Publish with vercel deploy --prod after signing into the intended account. The Vercel source has no secret requirements for its read-only public data feed.

The backend data service protects maintenance routes using a Site service token verified against an environment secret hash. Public job reads work anonymously. Failed source refreshes preserve the last successful snapshot. The web page reads the latest saved dataset every minute while open.

Verified: production build, TypeScript check, live API with 345 fully tagged posts, read-only method guard, feed failure handling, browser search and city filtering. The collector was refreshed through its protected endpoints and persisted successfully. The first scheduled occurrence is still in the future; schedule metadata confirms it is enabled.
