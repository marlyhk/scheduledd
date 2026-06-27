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
