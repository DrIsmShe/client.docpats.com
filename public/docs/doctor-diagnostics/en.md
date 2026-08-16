# AI Review of Clinical Material

The assistant reviews clinical material and indicates what warrants attention,
what should be clarified, and what is missing from the data. The section is located at
`/diagnostics`.

## The main rule

**You close the case, not the review.** Until you write your own conclusion,
the case will not close — the system will explicitly refuse and state that a case is closed
by the physician's conclusion, not by an AI review.

The model's output is never inserted into your report automatically, and every
one of its outputs is marked as supportive; this marking is immutable: it travels
together with the data into exports and any integration.

## What can be reviewed

Nine types of studies: laboratory tests, radiography, CT, MRI, ultrasound, ECG,
endoscopy, histology, dermoscopy. Plus **the clinical case as a whole** —
when what matters is not an individual image, but the overall picture.

Three different analyzers operate internally: one for study reports, one for
laboratory parameters, and one for the clinical case. Which of them is applied
is determined by what you have attached.

## Two conditions without which the review will not start

1. **The materials are de-identified** — the patient's name does not appear on the image or in the
   header of the form. This is your attestation: the system cannot verify the content for you.
2. **Consent for processing by an external model has been obtained** — the file leaves the
   platform, and this is a deliberate decision, not a checkbox enabled by default.

Until both attestations are in place, the review button will not work and will state what is
missing. The same two conditions apply to document recognition.

## Workflow

1. **Create a case** in the `/diagnostics` section: title, the question you
   want addressed by the review, and the clinical context.
2. **Attach the materials** — images, scans of forms, PDF. Files are stored
   encrypted.
3. If necessary, **run document recognition**: the model will extract text and
   parameters from the scan so you do not have to retype the form manually. The result is verified by
   a person who has the original in front of them.
4. **Start the review.** The case moves to the "under analysis" state; the work
   proceeds as tasks, and each one is visible separately — queued, running, completed,
   failed, or skipped. An individual task can be restarted without affecting
   the others.
5. **Work through the findings** (see below).
6. **Write your conclusion** and close the case.

A closed case can be **reopened** if necessary — for example, when additional
workup arrives.

## Findings and your verdict

Each finding is assigned a level of importance: **critical**, **important**, or
**note**.

For each finding you record a verdict: **agree**, **partially agree**, or **do not
agree**. Until a verdict is recorded, the finding is considered unreviewed.

The verdict is not a formality. It serves two purposes at once: it is feedback
to the review and, at the same time, your own annotation of the material, which you can return to
later.

## How many reviews are available

- **Lite** — 5 reviews per month.
- **Trial period and the Start plan** — 15 per month.
- **Growth** — 40 per month.
- **Pro** — 100 per month.

Counting is based on a rolling 30-day window rather than a calendar month: the quota
is released gradually rather than reset on the first of the month.

One important clarification about counting. A case with several modalities —
radiography, CT, laboratory — launches **a separate review for each**
modality, and it will occupy the same number of slots in the quota. This is not
nitpicking: each modality is an independent request to the model.

In addition to the monthly quota, two global limits apply — 20 reviews per hour and 60 per
day. They are identical across all plans and protect not the budget, but against an accidental
loop: a stuck button, a runaway script.

## Export

The case is exported in full: materials, findings with your verdicts, and your conclusion.
You can delete either an individual attached file or the entire case.

## What the assistant does not do

It does not make a diagnosis and does not prescribe treatment. The reason is not cautious
wording: a system that asserts a diagnosis about a living patient is a
medical device subject to separate regulation. As long as the module remains
supportive, that status does not apply, and the boundary must not be blurred "for
convenience."

<!-- translated-from-ru: a16f94496fc9c38880bd655c6d5ce8fdaf9710db -->
