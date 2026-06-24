Scheduled v1.6 — Request Access

Adds:
- Removes public Create First Admin button
- Adds Request Access form on login page
- Request saves name, email, phone, courses needed, and optional message
- Adds Admin > Access Requests tab
- Admin can approve or reject requests
- Approval creates a student account with a temporary password
- Students are not assigned to one tutor; after login, they can choose any tutor for a course

Important Firebase Rules:
Your Realtime Database rules must allow public write to accessRequests while keeping the rest protected.
Use the rules provided by ChatGPT after upload.
