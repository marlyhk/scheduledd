Scheduled v2.9 — Stable Separated Profiles

Use this instead of v2.7/v2.8 if pages were blank.

Important separation:
- Tutors tab = real tutor login accounts used for bookings/availability
- Tutor Profiles tab = public Browse Tutors profiles only
- Public profiles do NOT create login accounts
- Public profiles do NOT affect booking unless linked to a real tutor account
- Public Book Now -> Request Access
- Logged-in Book Now -> real booking only if linked

Deleted account recovery:
- If Firebase Auth email still exists but Scheduled profile was deleted, create the tutor/student again with the same email.
- The app creates a pending profile and links it on next login.
- If password is unknown, reset it from Firebase Authentication > Users.

Upload all files to GitHub and commit. Vercel redeploys automatically.
