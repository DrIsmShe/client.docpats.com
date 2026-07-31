# Patients in the Physician's Office

This section explains how to add a patient, maintain the patient's chart, remove the patient from your office, and restore the patient. All of this resides in the **Polyclinic** section of your office.

## Two types of patients

**Registered** — the individual has an account on the platform. They can view their own data in their personal account and personally authorize your access to sections of the chart. You locate such a patient by email address: it is mandatory and serves as the link to their account.

**Private** — the individual has no account, and you maintain the record yourself. The chart is completed in the same way, but the patient cannot view it and cannot authorize anything.

The type is selected at the moment of addition and determines which page you use. Subsequently, the charts coexist in a shared list.

## How to add a patient

1. Open the **Polyclinic** section — page `/dp/polyclinic`. This is the list of your patients.
2. Select the type of addition:
   - registered — `/dp/add-patient-polyclinic`;
   - private — `/dp/add-private-patient-polyclinic`.
3. Complete the record. The fields are identical for both types:
   - email address — **mandatory**; without it, the addition will not go through;
   - telephone number, identity document;
   - first and last name, sex, date of birth (dd/mm/yyyy format);
   - country and address;
   - immunizations, allergies, chronic conditions, family history, previous surgical procedures, harmful habits, free-text note;
   - photograph — optional; the image is resized automatically.
4. Save. The patient will appear in the list and become available for appointment scheduling, examinations, and medical history.

You can find an already registered patient on the search page — `/dp/search-patient-polyclinic`.

## How many patients you can add

There are two limits here, and they are distinct:

- **Until your physician account is verified — no more than 5 patients.** When you attempt to add a sixth, the system will ask you to complete verification. This is a safeguard against fictitious offices, not a subscription plan limit.
- **Thereafter, the plan limit applies.** During the trial period this is 600 patients per office. Once it is exhausted, a message will appear indicating that you need to change your plan.

Verification and the subscription plan are different matters: verifying your account removes the five-patient threshold but does not increase the plan limit.

## What can be maintained in the chart

The patient chart is opened from the list page: `/dp/patient-detail/<id>` for a registered patient and `/dp/private-patient-detail/<id>` for a private patient.

The following are maintained within the chart:

- complaints;
- anamnesis morbi and anamnesis vitae;
- status praesens and status localis;
- laboratory test results;
- CT, MRI, and ultrasound reports;
- recommendations.

The medical history is added on a separate page — `/dp/add-patient-medical-history/<id>`.

Repeat examinations do not need to be typed out again: they are assembled from templates that you configure to suit your practice.

## How to remove a patient from your office

**There is no deletion as such — the patient is moved to the archive.** This is intentional: medical records must not disappear with a single click.

What happens when a patient is removed from the office:

- the chart is flagged as archived, and the archiving date is retained;
- the patient disappears from the main list — by default, only active patients are displayed;
- the records themselves are not lost.

Archived charts can be viewed by switching the list view: it can display active patients, archived patients, or all of them at once.

## How to restore a patient from the archive

Archiving is reversible: the chart is restored and reappears in the active list with all of its records. There are separate actions for the two types: restoring a registered patient and restoring a private patient.

Because deletion within the office is in fact archiving, a patient's history cannot be lost through an accidental click.

## What the patient sees

A registered patient views their chart in their personal account and **decides for themselves which sections to open to you**: allergies, appointments, visits, images and reports, immunizations, previous surgical procedures — each individually. Until a section is opened, you cannot see it.

Every access to a patient's chart is recorded in a log that cannot be modified or deleted.

A private patient does not see their chart: they have no account, and therefore no means of granting access.

Separately, it may happen that a patient with an account **adds you themselves** to their list of physicians from their personal account. In that case, the chart is immediately linked to their account, and thereafter they manage access to sections in the usual manner.

<!-- translated-from-ru: 6dc02c2e379dca99d56422b318f23c229fc1b6ef -->
