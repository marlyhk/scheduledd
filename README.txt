Scheduled Final Version

Upload all files to GitHub and commit. Vercel redeploys automatically.

Important Firebase Realtime Database rules for public Request Access:
{
  "rules": {
    "accessRequests": { ".read": "auth != null", ".write": true },
    ".read": "auth != null",
    ".write": "auth != null"
  }
}

Includes final requested updates: Request Access, Become a Tutor WhatsApp, credential WhatsApp messages, better branding, booking confirmation pop-up, hidden buffer text, tutor/student sections, admin tutor editing, university filter, location options, calendar availability, and Firebase-connected booking.
