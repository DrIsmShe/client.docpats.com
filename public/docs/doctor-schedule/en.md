# Appointments and Physician Schedule

This section explains how to open time slots for booking, what happens when a patient books an appointment, and where to review appointment history.

## How the Schedule Works

The schedule is defined **by day of the week**, not by individual date. For each day of the week, you specify one or more working intervals — for example, 09:00–13:00 and 15:00–18:00.

Each interval has its own settings:

- **slot duration** — how many minutes one appointment takes. The default is 20 minutes; values from 5 to 240 are permitted;
- **appointment type** — in-person or video. The same day may contain intervals of different types: for example, in-person in the morning and video in the evening.

From the intervals and the slot duration, the platform automatically generates the available time that the patient sees. There is no need to enter each slot separately.

The schedule has its own **time zone** (Asia/Baku by default). The times in the intervals are local to that time zone, so a patient in a different time zone sees the time correctly converted for their own location.

## How to Set Up the Schedule

1. Open `/doctor/doctor-schedule`.
2. Select a day of the week and add an interval: start time, end time, slot duration, appointment type.
3. If necessary, add a second interval on the same day — this is how you create a break, for example for lunch.
4. Save. Available slots will appear for patients automatically.

An interval can be deleted — that time will then no longer be offered on that day.

## Vacation, Conference, or a Single Blocked Day

For specific dates there are **exceptions**, which override the weekly schedule:

- **day off** — the day is closed entirely, and no bookings appear for it;
- **special hours** — different intervals apply on that date instead of the usual ones.

You may add a reason to an exception — it is for your own reference; the patient does not see it.

The advantage of an exception is that it does not disrupt the main schedule: after the specified date, everything reverts to the weekly grid.

## What Happens When a Patient Books an Appointment

The booking appears on your side with the status **"pending confirmation."** It then moves through the following statuses:

- **pending confirmation** — the patient has selected a slot and you have not yet responded;
- **confirmed** — you have approved the appointment;
- **canceled** — the appointment will not take place;
- **completed** — the appointment has been conducted;
- **no-show** — the patient did not attend;
- **refunded** — applies if a payment was made for the booking.

Bookings are not created by patients only: an appointment may also be entered by the physician or by the front desk. The identity of the person who created the booking is recorded.

To review and manage bookings, go to `/doctor/doctor-appointment`. An appointment summary is available at `/doctor/dashboard`.

## In-Person and Video Appointments

The type is defined in the schedule and carried over to the booking. For a video appointment, the means of connection is specified instead of the office address: the platform's built-in video room, WhatsApp, or Zoom.

The built-in video room opens directly in the browser — nothing needs to be installed.

## Booking Archive

Completed bookings can be **moved to the archive** so that they do not clutter your working list: `/doctor/appointments/archive`. Archiving is reversible — a booking can be returned to the general list.

As with patient charts, the archive here replaces deletion: appointment records are not lost.

## Change Log

A **log** is maintained for every booking: who created, confirmed, canceled, or rescheduled it and when, who marked it as completed or as a no-show, as well as system events — for example, the end of a video session. To review it, go to `/doctor/audit`.

The log is useful in a disputed situation: it shows not the current status of the booking but its entire history, including the person responsible for each action.

## What the Patient Sees

- `/patient/appointment` — selecting a physician and booking an available time;
- `/patient/my-appointment` — upcoming appointments;
- `/patient/my-appointment-history` — past appointments.

The patient sees only the time that is opened by your schedule and is not occupied by another booking or blocked by an exception.

<!-- translated-from-ru: f4758353cd7de6e2ccf588e9e72f5905824cbbf2 -->
