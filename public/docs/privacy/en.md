# How DocPats Handles Your Data

This is a technical description of how the platform stores and protects data —
not a legal document. A formal privacy policy is in preparation
and will be published here once it has undergone legal review. For any question
about your data, write to [support@docpats.com](mailto:support@docpats.com).

---

## What We Store

**Account data** — name, email address, telephone number, interface language, role.

**Medical data** — only what you or your physician has entered: encounters,
complaints and history, laboratory results, imaging reports, immunizations,
allergies, past surgical procedures, chronic conditions.

**Correspondence and attachments** in the chat with your physician, as well as records of video consultations
(the fact and duration, not the content).

**Technical records** — the log of accesses to medical records, sessions,
interface events with no link to content.

## How This Is Protected

**Encryption at rest.** Personal and medical text data —
names, contact details, complaints, reasons for the visit, chat messages — are stored
encrypted rather than in plain text. Surgical modeling data
are encrypted with a separate algorithm that includes an integrity check: a corrupted surgical
plan will not decrypt at all, rather than silently returning incorrect
figures.

**Search without decryption.** So that a physician can find a patient by telephone number without
exposing the entire database, an irreversible fingerprint of the field is stored
alongside the encrypted value. The fingerprint can be used to verify a match, but the
original number cannot be reconstructed from it.

**Access log.** Every access to a medical record is written to a
separate log that **cannot be altered or deleted** — the prohibition is enforced at
the level of the database itself, not in interface settings. The log is retained for seven years. It
records structural information: who accessed which section and when — but not the
content of the record.

**Separation between clinics.** One clinic's data are inaccessible to another at
the level of database queries: the clinic affiliation is inserted automatically into every
query, and a query attempting to reach another clinic's data is rejected. This is a
property of the storage layer, not an interface check that can be circumvented.

## Who Sees What

A physician gains access to your record **only after your confirmation** and
only to those sections you have opened: allergies, encounters, visits,
imaging studies and reports, immunizations, past surgical procedures — each one separately.
You may open allergies to a dentist and withhold your surgical history.

Access can be revoked. Revocation does not delete the record that access was granted.

## Your Rights to Your Data

**Export without restrictions on any plan, including the free one.** Storing
your history and accessing it are always free — the paid part of the platform concerns
AI assistance and discounts on consultations, not your own data.

**Deleting your account** deletes your data. Entries in the access log are
retained: they contain no medical content, and their immutability is
the condition that makes the log meaningful at all.

## What We Do Not Do

- We do not sell or transfer medical data to third parties.
- We do not use the content of your records for advertising.
- We do not accept funding from pharmaceutical companies and do not publish
  promotional content disguised as editorial material.

## External Services

Part of the work is performed by third-party providers: storage of files and images,
delivery of email and push notifications, payment processing, language models for
analyzing clinical material. Only what is necessary for the
specific operation is transmitted to them.

---

**Questions about your data:** [support@docpats.com](mailto:support@docpats.com).
See also [how HIPAA compliance works](/docs/hipaa).

<!-- translated-from-ru: a71000c5d4c22e210a5df89082c7b4e1628fe61f -->
