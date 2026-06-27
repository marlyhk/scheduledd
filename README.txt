Scheduled v8.3 — v6.7 Clean Booking Module

Built directly from Scheduled v6.7 stable.

Changed only:
- Booking module replaced cleanly.
- Payments permissions adjusted:
  - student read-only and auto-refresh every minute
  - assigned tutor/admin can edit paid/unpaid

Booking behavior:
- Past dates automatically unavailable with red strike.
- Past times today disappear.
- Tomorrow/future days show available times.
- Calendar refreshes every minute.
- Booking confirmation sends details to tutor by WhatsApp.
- Removed Go to My Sessions and reschedule/contact notes.

Checks:
- JS syntax check passed.
- Critical duplicate function check passed.
