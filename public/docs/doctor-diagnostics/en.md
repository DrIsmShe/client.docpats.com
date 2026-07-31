# AI Material Review

The assistant reviews clinical material and highlights what deserves attention,
what should be clarified, and what is missing from the data. The section is located at
`/diagnostics`.

## The Cardinal Rule

**You close the case, not the review.** The case will not close until you write your own
conclusion — the system will refuse outright and state that a case is closed
by the physician's conclusion, not by an AI review.

The model's output is never inserted into your report automatically, and every
one of its outputs is flagged as supportive. This flag is immutable: it travels
with the data into any export and any integration.

## What Can Be Reviewed

Nine study types: laboratory tests, radiography, CT, MRI, ultrasonography, ECG,
endoscopy, histology, and dermoscopy. Plus **the clinical case as a whole** —
for situations in which the individual image matters less than the overall picture.

Three distinct analyzers operate under the hood: one for study reports, one for
laboratory parameters, and one for the clinical case. Which one is applied
is determined by what you attach.

## Two Conditions Without Which the Review Will Not Start

1. **The materials are de-identified** — the patient's name does not appear on the image or in the form header.
   This is your attestation: the system cannot verify the content on your behalf.
2. **Consent for processing by an external model has been obtained** — the file leaves the
   platform, and this is a deliberate decision, not a checkbox enabled by default.

Until both attestations are in place, the review button will not work and will report what is
missing. The same two conditions apply to document recognition.

## Workflow

1. **Create a case** in the `/diagnostics` section: title, the question you
   want reviewed, and the clinical context.
2. **Attach the materials** — images, scanned forms, PDF. Files are stored
   encrypted.
3. If needed, **run document recognition**: the model will extract text and
   parameters from the scan so that you do not have to retype the form manually. The result is verified by a
   person who has the original in front of them.
4. **Start the review.** The case moves to the "under analysis" state; the work
   proceeds as tasks, and each one is visible separately — queued, running, completed,
   failed, or skipped. An individual task can be restarted without affecting the
   others.
5. **Adjudicate the findings** (see below).
6. **Write your conclusion** and close the case.

A closed case can be **reopened** if necessary — for example, when additional
workup results arrive.

## Findings and Your Verdict

Each finding is assigned a level of importance: **critical**, **important**, or
**note**.

For each finding you record a verdict: **agree**, **partially agree**, or **do not
agree**. Until a verdict is recorded, the finding is considered unadjudicated.

The verdict is not a formality. It serves two purposes at once: it is feedback
to the review and, at the same time, your own annotation of the material, which you can return to
later.

## How Many Reviews Are Available

- **Trial period and the Growth plan** — 60 reviews per month.
- **Start** — 20 per month.
- **Pro** — unlimited.

## Export

The case is exported in full: materials, findings with your verdicts, and your conclusion.
You can delete either an individual attached file or the entire case.

## What the Assistant Does Not Do

It does not establish a diagnosis and does not prescribe treatment. The reason is not
cautious wording: a system that asserts a diagnosis about a living patient is a
medical device subject to separate regulation. As long as the module remains
supportive, that status does not apply, and this boundary must not be blurred "for
convenience."

<!-- translated-from-ru: 5fdd2268fb0e8df3c981fb51e6aeb3a65d4f3234 -->
