# Production Deployment Guide

## Build for Production
To create an optimized production build:
```bash
npm run build
```
The output will be in the `dist/` folder.

## Option 1: Firebase Hosting (Recommended)
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init`
   - Select **Hosting**.
   - Use existing project.
   - Public directory: `dist`
   - Configure as single-page app: **Yes**
4. Deploy:
   ```bash
   npm run build
   firebase deploy
   ```

## Option 2: Vercel / Netlify
1. Connect your Git repository.
2. Settings:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Environment Variables**:
   - Add all `VITE_FIREBASE_...` and `VITE_APP_ENCRYPTION_KEY` variables in the Vercel/Netlify project settings.

## Security Checklist
- [ ] Ensure Firebase Rules are set to `auth != null`.
- [ ] Use a strong, random string for `VITE_APP_ENCRYPTION_KEY`.
- [ ] Disable "Sign Up" in `Login.jsx` (currently not implemented, manual user creation in Firebase Console is recommended for internal tools).
