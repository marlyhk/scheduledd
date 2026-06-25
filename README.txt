Scheduled Final Fixed v2.1

Upload all files to GitHub and commit. Vercel redeploys automatically.

Important Firebase rules:
{
  "rules": {
    "accessRequests": {
      ".read": "auth != null",
      ".write": true
    },
    ".read": "auth != null",
    ".write": "auth != null"
  }
}

Fixed:
- My Students tab opens
- My Tutors tab opens
- Tutor availability is shown/used in booking
- Unavailable/no-slot calendar days are slashed
- Course-specific availability
- Global blocking across tutor courses
- Hidden 15-minute buffer without student-facing text
- Booking confirmation modal
- WhatsApp credentials and booking confirmations
