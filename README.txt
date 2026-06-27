Scheduled v9.2 — Booking System Redesign

Built from Scheduled v6.7 stable only.

Rebuilt:
- Booking system
- Calendar/availability engine
- Payment permissions
- Internal chat

Kept:
- Existing v6.7 structure, dashboard, sidebar, auth, Firebase, animation assets, and other working pages.

Booking:
- Flow: Tutor → Course → Session Type → Duration → Calendar → Times → Summary → Confirm.
- Online / On Campus segmented buttons.
- Monthly calendar with previous/next month.
- Calendar is contained inside its card.
- Past dates disabled with red strike.
- All valid available times shown in a scrollable grid.
- Booked, expired, unavailable, and overlapping slots hidden.
- Duration-based validation.
- Whish only.
- WhatsApp confirmation with booking details.
- Auto-refresh every minute.

Payments:
- Students view only.
- Tutor can edit own students.
- Admin can edit all.
- Paid green, unpaid red.
- Student payment page refreshes every minute.

Chat:
- Floating chat button with unread badge.
- Students chat with assigned tutors.
- Tutors chat with assigned students and can broadcast to all assigned students.
- Admin can chat with students/tutors.
- Realtime polling refresh.

Checks:
- JavaScript syntax check passed.
- Critical duplicate function check passed.
