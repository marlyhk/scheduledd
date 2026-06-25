Scheduled v3.1 — Existing Email Tutor Fix

Fix:
- Tutors tab keeps original booking-account behavior.
- If you add a booking tutor with an existing Firebase Auth email, Scheduled stores the tutor profile by email.
- When that tutor logs in with the same email/password, Scheduled links the profile automatically and gives access.

Separation:
- Tutors tab = real booking/login tutor accounts.
- Tutor Profiles tab = public Browse Tutors only with photo + description.
- Public profiles do not affect booking unless linked to a real booking tutor account.

Recovery:
1. Add the tutor again in Admin > Tutors using the exact same email.
2. Ask the tutor to log in using that same email/password.
3. If they forgot the password, reset it in Firebase Authentication > Users.
