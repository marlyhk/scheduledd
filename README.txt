Scheduled v2.6 — Accounts + Uploads

Adds:
- Tutor profile picture upload from files/photos, compressed and stored in Realtime Database
- Admin can update tutor profile photo using a file picker
- Add tutor even if Firebase Auth email already exists: creates a pending Scheduled profile by email and links it on next login
- Admin can edit student information
- Admin can delete students from Scheduled
- Admin delete tutor/student removes their Scheduled profile so they cannot access the platform
- Note: full Firebase Authentication email deletion still requires Firebase Console unless backend Admin SDK is added

Upload all files to GitHub and commit. Vercel redeploys automatically.
