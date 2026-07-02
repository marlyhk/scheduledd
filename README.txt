Scheduled v9.4 — Availability Type Compatibility Fix

Built from v9.3.

Fixes:
- Existing old availability blocks no longer disappear.
- Untyped old availability is treated as Online only, not both Online and On Campus.
- Online availability still does not appear under On Campus.
- On Campus availability still does not appear under Online.
- Supports multiple possible field names for session type:
  sessionType, type, mode, availabilityType, locationType, format, online, campus, onCampus, etc.
- Preserves v9.2/v9.3 booking layout.

JS syntax check passed.

Scheduled Payment Receipt Feature
- Generates a unique random receipt number in the format STH-YYYY-XXXXXX.
- Receipt numbers are reserved through Firebase Realtime Database transactions to prevent duplicates.
- Paid sessions expose View Receipt and Download Receipt to the student, assigned tutor, and admin.
- Only the assigned tutor and admin can use Send on WhatsApp.
- Mobile Web Share sends the PDF directly when supported; desktop fallback downloads the PDF and opens the student's WhatsApp chat with a prepared message.
- If a payment is reversed or the session is cancelled, the receipt remains for audit history and displays VOID or CANCELLED.
