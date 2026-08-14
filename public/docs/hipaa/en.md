# HIPAA: What Has Been Implemented in the Platform

An honest statement: DocPats is **built with HIPAA requirements for handling
medical data in mind**. This is not the same as a completed third-party audit
and a signed business associate agreement (BAA) — we do not yet have these, and
claiming otherwise would be dishonest.

Below is exactly what has been implemented, so that you can judge for yourself
rather than take our word for it. For inquiries:
[support@docpats.com](mailto:support@docpats.com).

---

## An Access Log That Cannot Be Scrubbed

Every access to a medical record is written to a separate log. Modification and
deletion of entries are **prohibited at the data model level**, not through a
permissions setting: a platform administrator physically cannot edit the access
history. The retention period is seven years.

The log captures structure: who accessed which resource, when, and with what
action. **Clinical content is never written to the log** — this is a separate
rule in the code, because the log outlives the data itself and must not become a
second, less protected repository for it.

## Encryption of Data at Rest

Textual information that allows a patient to be identified, as well as medical
records, is encrypted before being written to the database. For the surgical
planning domain, an algorithm with integrity verification is used: a tampered
surgical plan will not decrypt, rather than returning plausible but incorrect
data.

Search across encrypted fields is implemented through irreversible fingerprints:
a physician can find a patient by phone number, but the number cannot be
reconstructed from the fingerprint.

## Minimum Necessary Access

A registered patient personally confirms a physician's access and opens sections
of the record **individually**. Consent can be revoked.

Within a clinic, permissions are divided across nine roles — from owner to
pharmacist — and a permission can be refined down to the level of an individual
section for a specific staff member. Elevating another person's role above one's
own is prohibited: a staff member cannot grant permissions that they do not
themselves hold.

## Isolation Between Clinics

Clinic affiliation is automatically inserted into every database query, and any
query attempting to retrieve another clinic's data is rejected. This is a
property of the data access layer, not a check in the interface. The project
includes dedicated tests for this scenario: data from clinic A is requested with
the context of clinic B and must return nothing.

## What Artificial Intelligence Does and Does Not Do

The interpretation of laboratory results and images is flagged as supportive; the
flag is immutable and travels with the data into any export. A case cannot be
closed until the physician writes their own conclusion, and the model's output is
never inserted into it automatically. Responsibility for the clinical decision
remains with the human — this is embedded in the architecture of the system, not
in a fine-print disclaimer.

## What Is Not Yet in Place

- **A third-party HIPAA compliance audit.**
- **A signable BAA** for partner clinics.
- **SOC 2 certification.**

If you require these documents for your practice, write to us and we will discuss
timelines: [support@docpats.com](mailto:support@docpats.com).

---

See also [how the platform handles your data](/docs/privacy).

<!-- translated-from-ru: e3c4adfd989f60b3d8945845f2af0baddb294dbf -->
