# Google OAuth Setup

Cara dapat Google Client ID & Client Secret:

1. Buka https://console.cloud.google.com
2. Buat project baru atau pilih yang sudah ada
3. Aktifkan **Google+ API** dan **People API**
4. Credentials → Create Credentials → OAuth 2.0 Client ID
5. Application type: **Web application**
6. Authorized redirect URIs:
   - `https://nana.mwcs.dev/api/auth/callback/google`
7. Copy **Client ID** dan **Client Secret**
8. Update di:
   - `.env.local` (baris `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`)
   - `ecosystem.config.js` (field `env.GOOGLE_CLIENT_ID` & `env.GOOGLE_CLIENT_SECRET`)
9. Restart: `pm2 restart nanaAI --update-env`
