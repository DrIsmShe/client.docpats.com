# Patient Portal

What you see in your account, what you control, and how you grant a physician access to your data.

## Your history

- **Medical history** — `/patient/my-medical-histories`; each individual entry
  opens in full.
- **Lab results** — `/patient/my-lab-results`.
- **Prescriptions** — `/patient/my-prescriptions`.
- **Imaging and study files** — `/patient/get-patients-files`. Organized by
  modality: radiography, CT, MRI, ultrasound, ECG, echocardiography, EEG, Holter
  monitoring, spirometry, gastroscopy, capsule endoscopy, coronary angiography,
  angiography, PET, SPECT, gynecologic examination, laboratory.

Entries are made by the physician providing your care. Your history is not tied
to a single clinic: if you change physicians or cities, it stays with you.

## Who can see your data

Nothing is disclosed automatically. When a physician or clinic requests access,
the request comes to you — `/patient/consent-requests` — and the access you have
granted is visible in `/patient/my-clinics`.

**Permission is granted section by section, not all at once.** The following are
disclosed separately:

- visits and visit records;
- allergies;
- chronic conditions;
- past surgeries;
- family history;
- immunizations;
- images and reports.

You may disclose allergies to your dentist without disclosing your surgical
history.

## Why access is requested

Every consent has a purpose, and the duration depends on it:

- **treatment** at that clinic;
- **referral** — a one-time specialist consultation;
- **second opinion** — access for another clinic;
- **emergency care** — this type of consent **expires automatically after 7 days**;
- **research** — de-identified data only.

Consent can be **revoked at any time**, and revoking it again causes no problems.
A consent may also have a predefined expiration date, after which access ends
without any action on your part.

Consent may be signed electronically, including via ASAN İmza, or you may attach
a scan of a paper form.

## Verification at every request

Access is verified **not once at the time it is granted, but every time the
physician opens a section of your chart**. If you revoke consent, the very next
request to that section will be denied.

Every access to your data and every action involving consents is recorded in a
log that cannot be modified or deleted.

## Physicians and appointment booking

- **Physician search** — `/patient/doctors`; profile — `/patient/doctor-details/<id>`.
- **My physicians** — `/patient/my-doctors`.
- **Booking** — `/patient/appointment`: you select an available time slot from
  the physician's schedule.
- **Upcoming appointments** — `/patient/my-appointment`; past appointments —
  `/patient/my-appointment-history`.
- **Video visit** — `/patient/telemed`; runs in the browser, with nothing to
  install.

A booking first goes to the physician for confirmation — its status is visible in
the appointment list.

## Communicating with your physician

Chat — `/patient/communication`. Conversations are saved, and files can be
attached. Messages are translated: you write in your own language, and the
physician reads in theirs.

## Medical assistant

`/patient/consultation-ai` — review of your symptoms, explanation of lab results,
and guidance on which specialist to see. It does not make diagnoses; if there are
warning signs, it immediately advises calling emergency services, and after
several messages it offers to compile a **discharge-style summary** — a brief
digest of the conversation that is convenient to bring to your physician.

You can try it without registering.

## Also in the portal

- **Notifications** — `/patient/notifications-for-patient`.
- **Articles by physicians** — `/patient/all-articles`, and AI-curated materials
  on a given topic — `/patient/articles-ai-for-patients`.
- **Invitation** — `/patient/invite`.

## Your data belongs to you

Exporting your own history is available **without restrictions on all plans,
including the free one**. The paid features are AI assistance and a discount on
video visits — not access to your own data.

<!-- translated-from-ru: f52cfd86425a346d1f8e0f46520c2bafbe599ebf -->
