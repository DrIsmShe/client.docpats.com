# DocPats Surgical Simulation — User Guide

**Document version:** 1.0 (MVP)
**For:** Practicing plastic surgeons, ENT specialists, cosmetologists

---

## Table of Contents

1. [What Is Surgical Simulation](#what-is-surgical-simulation)
2. [The Workflow in 2 Minutes](#the-workflow-in-2-minutes)
3. [Creating a New Plan](#creating-a-new-plan)
4. [Patient Photograph Requirements](#patient-photograph-requirements)
5. [The Editor Interface](#the-editor-interface)
6. [Working with Control Points](#working-with-control-points)
7. [Advanced Deformation Techniques](#advanced-deformation-techniques)
8. [Patient Consultation](#patient-consultation)
9. [Export and Documentation](#export-and-documentation)
10. [Saving, Duplicates, Deletion](#saving-duplicates-deletion)
11. [Keyboard Shortcuts](#keyboard-shortcuts)
12. [Confidentiality and PHI](#confidentiality-and-phi)
13. [Troubleshooting](#troubleshooting)
14. [Workflow Recommendations](#workflow-recommendations)
15. [Version Roadmap](#version-roadmap)

---

## What Is Surgical Simulation

The Surgical Simulation module is a tool for visualizing the anticipated outcome of a plastic surgery procedure on the patient's photograph prior to intervention. You upload a photo, place control points in the zones targeted for correction, and drag them to the desired position — the image deforms in real time, showing the expected result.

The tool is built on 2D deformation (liquify / mesh warp) using a Radial Basis Function and a Gaussian filter. All computation is performed in the browser using a WebWorker; patient data does not leave your device until the plan is saved to the secure DocPats server.

**Use this module for:**

- Consulting with the patient before a decision on surgery is made
- Clarifying expectations (expectation management)
- Documenting the preoperative plan
- Creating visual material for informed consent
- Internal discussion of options within the clinic team

**The module does not replace:**

- Clinical assessment of the patient
- Radiographic planning
- 3D scanning (when indicated)
- A legally binding medical opinion

The simulation result is an **approximate visualization**, not a guarantee of a specific surgical outcome.

---

## The Workflow in 2 Minutes

**Step 1.** Main menu → "Simulation" → the `+ New plan` button in the upper right corner.

**Step 2.** In the window that opens, drag in the patient's photo or click the upload area. Accepted formats: JPG, PNG, WebP. Maximum size: 20 MB. Minimum resolution: 200×200 px.

**Step 3.** On step 2 of the modal window, enter the plan name (for example: "Ivanov I.A. — rhinoplasty, option 1") and, optionally, a patient identifier. Click "Create".

**Step 4.** The editor opens. Switch the mode to "Add point" (the `+●` icon in the upper panel). Click in the zones targeted for correction — control points will appear.

**Step 5.** Switch to "Select" mode (the arrow-cursor icon). Drag the blue circle of each point to the desired position. The image deforms in real time.

**Step 6.** When the result matches the surgical plan, switch to the "Before / After" tab in the upper right corner. The slider shows the comparison.

**Step 7.** In the "Export" panel, choose the format (JPG/PNG) and mode (before / after / side-by-side) and click "Download". The file is saved locally.

All changes are saved automatically every 2 seconds. The save indicator is located on the right side of the toolbar.

---

## Creating a New Plan

### Naming the Plan

The plan name is encrypted in the database and accessible only to you. Recommended name structure:

`[Фамилия И.О.] — [тип операции], [вариант]`

Examples:

- `Петрова А.Б. — ринопластика, консервативный`
- `Петрова А.Б. — ринопластика, агрессивный`
- `Сидоров В.К. — blepharoplasty, оба глаза`

Create several plans for the same patient when you are discussing **options** — conservative / moderate / aggressive. This lets the patient compare them during the consultation.

### Patient Identifier

This field is optional. You may use:

- The clinic's medical record number
- Initials
- An internal code

This field is also encrypted. Do not use the patient's full name if the clinic operates under GDPR/HIPAA requirements — the record number is sufficient.

### Searching and Sorting Plans

The plan list supports:

- **Search** by name or patient identifier (case-insensitive)
- **Sorting**: newest to oldest, oldest to newest, alphabetical

---

## Patient Photograph Requirements

The accuracy of the simulation depends critically on the quality of the input photograph.

### Mandatory Conditions

**Resolution.** At least 1000×1500 px on the short side. Optimal is 2000×3000 px. A smartphone photo taken in standard mode is suitable. Selfies and webcam photos are not recommended because of perspective distortion from the wide-angle lens.

**Lighting.** Even frontal lighting, with no harsh shadows on the face. Avoid bright sunlight and backlighting. Optimal is a studio softbox or diffuse daylight at a window.

**Distance from the camera.** No closer than 1.5 meters. This minimizes perspective distortion of the nose and chin. Use a 50–85 mm focal length equivalent (on an iPhone, use the 2× telephoto lens rather than the wide lens).

**Neutral facial expression.** The patient is not smiling; the lips are closed but not compressed. The eyes are open and directed at the camera. No mimetic muscle contraction.

**Hair.** Pulled away from the face. Not covering the forehead, ears, or jawline. Ideally tied back.

**Jewelry and makeup.** Removed. Piercings, large earrings, and bright lipstick all distort the reference.

**Neutral background.** Light and uniform (gray, white, pale blue). No patterns, textures, or bright objects behind the head.

### Views

For comprehensive planning it is advisable to have three photographs of the same patient:

1. **Frontal** — for assessing symmetry, alar width, and lip shape
2. **Profile** (left and right) — for assessing the nasofrontal angle, dorsum, nasal tip, and chin
3. **3/4** (oblique) — for assessing midface volume and the malar region

**Important:** in the current version (MVP), each photo = a separate plan. Multi-view within a single plan is planned for the next version (v2).

### What to Do If the Photo Does Not Meet the Requirements

Do not upload it. Ask the patient to retake it, or retake it yourself at the clinic. Deformation applied to a poor photo creates false expectations, which leads to conflict after surgery.

---

## The Editor Interface

### Page Header

- **The "← Back to plan list" arrow** — returns to the list of all plans.
- **Plan name and patient ID** — displayed beneath the arrow.
- **The "Editor / Before-After" tabs** — switch the working mode.

### The Editor's Upper Panel (toolbar)

Located in the upper right corner of the canvas. Elements from left to right:

**1. "Select" mode** (arrow-cursor icon). When active, it is highlighted blue. In this mode:

- Clicking the canvas background and dragging pans the view (pan)
- Clicking a point's blue circle selects it and allows dragging (drag)
- Clicking the yellow square selects the point
- Alt + dragging the yellow square moves the anchor

**2. "Add point" mode** (the `+●` icon). Blue when active. In this mode, clicking on the photo creates a new control point.

**3. Undo / Redo** (the ↶ / ↷ icons). Undoes and restores the last action. Inactive when there is nothing to undo. Hotkeys: Ctrl+Z / Ctrl+Shift+Z (Ctrl+Y).

**4. Zoom −** / percentage / **Zoom +**. Decreases and increases magnification. The current percentage is shown in the middle. Also available via the mouse wheel — zoom is anchored to the cursor (as in Figma).

**5. "Fit"** — fits the photo to the canvas size.

**6. "1:1"** — resets zoom to 100% and centers the photo.

**7. Save indicator** — the last element on the right:

- `●` pulsing blue — saving in progress
- `✓` green — saved
- `✕` red — save error (check your internet connection)

### Lower Information Bar

In the lower left corner it displays:

- The photo resolution (example: `677×1200`)
- The number of deformation points

### Point Properties Panel

Appears in the lower right corner when any point is selected. It contains:

- **Radius (zone of influence)** — a slider from 1–50%. Determines the deformation zone around the point. The smaller the radius, the more localized the change. The value is shown as a percentage of the image's long side. A dashed circle on the canvas visualizes the radius.

- **Strength** — a slider from −1.00 to +1.00. At 1.00 the point pulls pixels in the direction of displacement at full strength. At 0.50 — half. At negative values the point **pushes** pixels away from the displacement (used for reverse-correction effects).

- **The × in the header** — deletes the point.

- **Hints** at the bottom of the panel:
  - `Alt + перетаскивание квадрата — сдвиг центра`
  - `Del — удалить`

---

## Working with Control Points

### Anatomy of a Control Point

Each point consists of four elements:

1. **Yellow square (Anchor)** — the original center of deformation. It usually coincides with the location of the initial click. By default it does not move.

2. **Blue circle (Current)** — the target point. This is where you "want to move" the pixel located at the anchor position. It is the primary element for dragging.

3. **Dashed line** between the anchor and current — the displacement vector. It shows the direction and magnitude of the deformation.

4. **Dashed circle around the anchor** — the point's zone of influence. The farther a pixel is from the center, the smaller its displacement. Outside the circle there is no deformation.

### Adding Points

1. Switch to `+●` mode.
2. Click in the zones where correction is planned. Each click creates a new point.
3. When created, a point has anchor = current (that is, zero displacement). The default radius is 8%, strength 1.00.

### Moving a Point

1. Switch to "Select" mode.
2. Hold the left mouse button on the blue circle and drag it to the desired position.
3. The photo deforms in real time as you move.

### Fine-Tuning

1. Select the point (click the blue circle or the yellow square).
2. In the lower right panel, edit:
   - Radius — the width of the zone of influence
   - Strength — the force of the deformation

### Deleting a Point

Three methods:

- Select the point → click × in the properties panel
- Select the point → press Delete or Backspace on the keyboard
- Select the point → Escape clears the selection (it does not delete)

### Point Limit

The technical maximum is 200 points per plan. In practice, 10–25 points are sufficient for a high-quality rhinoplasty; for more complex interventions (complete facial reconstruction), up to 50–70.

---

## Advanced Deformation Techniques

The current MVP engine uses global RBF deformation. This yields good results for local changes but requires a certain technique for precise control.

### Technique 1 — Small Points for Local Changes

Problem: a large radius deforms not only the target zone but also adjacent structures. Solution: use a small radius (2–4%) for precise changes.

**Example: dorsal hump reduction**

1. Create a point directly at the apex of the hump.
2. Set radius = 2–3%.
3. Strength = 1.00.
4. Drag the blue circle **vertically downward** by 3–5 pixels.
5. The hump is smoothed while the adjacent portions of the nasal dorsum barely move.

### Technique 2 — Chains of Points Along a Line

Problem: a single point produces a circular (radial) distortion. To correct a **linear** structure (nasal dorsum, jawline, lip line), a chain of points is needed.

**Example: straightening the nasal dorsum**

1. Create 4–5 points along the nasal dorsum, spaced at 10–15% of the length of the nose.
2. Each point: radius 2–3%.
3. Drag the blue circles so that they align along the desired straight line.
4. Result: the nasal dorsum is straightened and the rest of the face is unaffected.

### Technique 3 — Anchor Points (anchors)

Problem: when one zone is deformed, an adjacent zone (for example, the cheeks next to the nose) also shifts slightly because of the propagation of the RBF field.

The solution is to place **anchor points** around the perimeter of the correction zone. Anchor points have anchor = current (the blue circle is not moved), but they participate in the warp calculation and hold adjacent pixels in place.

**Example: nasal tip correction without moving the lips**

1. Create a working point at the nasal tip, radius 5%, and drag it upward.
2. Create an anchor point at the philtrum (between the nose and the lip), radius 4%, and **do not move it**.
3. Create anchor points on either side of the alae, radius 3%, and **do not move them**.
4. The nasal tip is elevated while the philtrum and lip remain in place.

### Technique 4 — Negative Strength for "Inflation"

Sometimes you need not to shift a point but to "inflate" a region (wider alae, fuller lips).

1. Create a point at the center of the region you want to expand.
2. Drag the blue circle **beyond** the desired border.
3. Set strength to **−0.3 to −0.5** (a negative value).
4. Radius = 5–10%.
5. The zone is pushed away from the point = an expansion effect.

### Technique 5 — Multiple Options via Duplicates

For consultations it is convenient to have several options for the same procedure. Use the "Duplicate" function in the plan list:

1. Create the plan "Petrova A.B. — rhinoplasty, option 1 (conservative)".
2. Edit it: small displacements, subtle changes.
3. In the plan list → the "Copy" button on that plan.
4. Rename the duplicate: "Petrova A.B. — rhinoplasty, option 2 (moderate)".
5. Open it and increase the deformations.
6. Repeat for "option 3 (aggressive)".

During the consultation, show the patient all three options in sequence.

### What to Avoid

**Do not use a very large radius together with very large displacements.** This creates wave artifacts on the background and the hairline.

**Do not deform the background.** If the hairline / ear / shoulder falls within the radius, it will be distorted as well. Place anchor points around them to "lock" the background.

**Do not work at strong zoom-out.** Precise point placement requires 100% zoom or greater. Use `+` and `1:1` on the toolbar.

**Do not ignore symmetry.** If the patient requests nasal correction, deform both sides consistently. In the current MVP this is done manually (mirror mode will appear in v2).

---

## Patient Consultation

The "Before / After" tab is intended for **showing to the patient**. It contains a minimum of technical elements and a maximum of visual comparison.

### The Divider Slider

The central image is divided by a vertical line with a round handle. By dragging it left and right, the patient sees:

- Left part — the "Before" photo (the original)
- Right part — the "After" photo (with deformation)

The corners are labeled "BEFORE" and "AFTER" to prevent confusion.

### Recommended Consultation Scenario

1. Open the plan in fullscreen (F11 in the browser for full screen).
2. Show the patient the "Editor" tab — explain exactly what you plan to change, using the points themselves as visual markers.
3. Switch to "Before / After" and let the patient move the slider themselves.
4. Discuss whether this matches their expectations.
5. If there are other options (conservative / aggressive), close the current plan and open the next one.
6. In the end, select one option as final.
7. Export to PDF (or JPG + print) to attach to the informed consent.

### What Is Important to Tell the Patient

The simulation is a **visualization of the expected result, not a guarantee**. The actual surgical outcome depends on:

- Individual tissue characteristics (skin thickness, elasticity, cartilage thickness)
- The healing and scarring process
- The surgeon's technique
- The patient's adherence to the postoperative regimen

Deviations of ±10-20% from the simulation are normal and do not constitute a surgical defect. Use this wording in the informed consent.

---

## Export and Documentation

### The "Export" Panel

Located on the right side of the "Before / After" tab.

### What to Export

**1. Before surgery (original)** — the patient's original photo without deformations. Used for the medical record and as the "before" fact when comparing with the outcome.

**2. After surgery (with deformation)** — the photo with the warp applied. Used to show to the patient and to document the plan.

**3. Side by side: Before and After** — a side-by-side composition in a single image with the "BEFORE" and "AFTER" labels. The most convenient format for printing and for the informed consent.

### Format

**JPG** — recommended for most cases. Small file size, acceptable quality at 85-92%.

**PNG** — uncompressed, maximum quality. Use it if the result will be edited further in Photoshop or printed in large format.

### JPG Quality

Slider 40-100%. Recommendations:

- 60-70% — for email and messaging apps
- 80-90% — the standard for document print
- 95-100% — for archiving and publication

### Downloading

After configuring the parameters, click "Download". The file is saved to your browser's Downloads folder with a name of the form `plan-2026-04-24-ринопластика.jpg`.

### Documentation Recommendation

For each procedure, save the following in the patient's electronic record:

1. The original photo ("Before" export)
2. The simulated result ("After" export)
3. Side-by-side ("Side by side" export)
4. A screenshot of the editor with the control points visible (via Print Screen) — to make clear exactly what was planned

This creates complete documentation of pre-op planning and protects against post-op disputes with the patient.

---

## Saving, Duplicates, Deletion

### Autosave

All changes (adding/deleting points, changing their parameters, dragging) are saved **automatically 2 seconds** after the last action. Nothing needs to be done manually.

The save indicator in the upper toolbar shows the current status:

- `●` pulsing blue — saving in progress
- `✓` green — saved
- `✕` red — error (check your internet connection)

When the page is closed or you switch to another tab, a forced save occurs. Data is not lost.

### Duplicating a Plan

In the plan list, each card has three buttons: "Open", "Copy", "Delete".

**Copy** creates a complete duplicate of the plan with the same photo and all control points. The duplicate appears at the top of the list. Rename it before editing (for example, add "(option 2)" to the name).

Used for:

- Creating several surgical options
- Backing up a plan before experimental changes
- Transferring settings to similar anatomy

### Deleting a Plan

The "Delete" button asks for confirmation. After confirmation:

- The plan is flagged as deleted in the database (soft delete)
- The patient's photo is removed from R2 storage after 24 hours (if no other duplicates reference that photo)
- The plan disappears from the list

**Caution:** deletion cannot be undone. If you want a safeguard, duplicate the plan before deleting the original.

---

## Keyboard Shortcuts

They work anywhere on the page except in input fields.

- **`Ctrl + Z`** — Undo
- **`Ctrl + Shift + Z`** or **`Ctrl + Y`** — Redo
- **`Delete`** or **`Backspace`** — Delete the selected point
- **`Escape`** — Clear the selection + switch to "Select" mode
- **`Mouse wheel`** — Zoom to the cursor position
- **`Alt + dragging the yellow square`** — Move the anchor of the selected point

Planned for future versions:

- `V` — "Select" mode
- `A` — "Add" mode
- `+` / `−` — zoom
- `0` — fit to view
- `1` — 100% zoom
- `Space + drag` — temporary pan mode

---

## Confidentiality and PHI

DocPats Surgical Simulation was developed in accordance with HIPAA (USA) and GDPR (EU) requirements regarding patient medical data.

### What Is Encrypted

- **Plan name** — AES-256-GCM, encrypted in the database
- **Patient identifier** — AES-256-GCM, encrypted in the database
- **Photograph** — stored in R2 with server-side encryption; access only through an authorized session

### What Is Not Encrypted

- Control points (coordinates, radius, strength) — these are not PHI in the sense of HIPAA, since they do not identify the patient separately from the photo and metadata
- Plan creation/update dates

### Access

- Only you, as the owner of the DocPats account, have access to your plans
- Neither Anthropic nor the DocPats team can read the contents of your plans
- In the event of a court order, encrypted data is provided; the key remains with the clinic

### Recommendations

**Use strong passwords and 2FA for your DocPats account.** A breach of your account = compromise of patient PHI.

**Do not save screenshots on an unprotected local disk** without a PIN/password. Exported JPG/PNG files are not encrypted automatically.

**Before decommissioning a clinic computer**, make sure the browser cache contains no copies of photos. Use browser privacy tools (for example, Cleanup Cache in Chrome).

**When working with European patients** (GDPR), obtain written consent for the processing of biometric data **before** uploading photos into the system.

---

## Troubleshooting

### The photo does not upload; "Görsel okunamadı" or "Image cannot be read" appears

**Cause 1:** The format is not supported. Only JPG, PNG, and WebP are supported. HEIC (iPhone native) **does not work**.

**Solution:** Convert the HEIC to JPG (Photos on Mac, or an online converter).

**Cause 2:** The photo is smaller than 200×200 px.

**Solution:** Use the original photo, not a thumbnail or preview.

**Cause 3:** The file is corrupted or is not a real image (for example, a .docx renamed to .jpg).

**Solution:** Open the file in your system viewer (Photos, Preview). If it does not open, the file is broken; use another one.

### The editor loads, but the canvas is empty

**Cause:** A CORS error while loading the photo from R2 storage. This usually happens on the first load, when Cloudflare has not yet cached the correct headers.

**Solution:** Wait 30 seconds and perform a hard refresh (Ctrl+Shift+R). If that does not help, contact DocPats technical support.

### Points appear but cannot be dragged

**Cause:** The browser is not receiving pointer capture events. Most often this is an outdated browser or a specific tablet/stylus setting.

**Solution:** Update your browser to the latest version (Chrome 120+, Firefox 115+, Edge 120+, Safari 17+). On a touchpad, use a mouse instead.

### The deformation is not applied to the photo (points move, but the photo does not change)

**Cause:** The WebWorker did not load. Chrome may block the worker when device memory is low.

**Solution:** Close unnecessary tabs and reload the editor (F5). If it recurs, use another browser or a computer with 8GB+ RAM.

### The save indicator is red (✕)

**Cause:** No connection to the DocPats server, or the session has expired.

**Solution:** Check your internet connection. If everything is fine, reload the page (changes from the last 2 seconds may be lost; everything else is saved).

### The plan list is empty even though I created plans

**Cause:** You are logged in under a different account, or you accidentally switched to the dev/staging environment.

**Solution:** Check the URL (it should be the clinic's production URL) and the email in your account settings.

### The photo is exported at low resolution

**Cause:** You are using the preview version of the photo (1200 px max) rather than the full-resolution original.

**Solution:** During export the system automatically applies the warp to the full resolution — wait until the loading indicator disappears (in the upper right corner of the export panel). Do not click "Download" before it does.

### The editor is slow and laggy

**Cause:** For plans with 50+ points and photos of 4000×6000 px, deformation becomes heavy for low-end devices.

**Solution:**

- Work in Fit mode (a smaller preview is computationally cheaper)
- Reduce the number of points (merge points that are close together)
- Use a device with a dedicated GPU

---

## Workflow Recommendations

Based on practical experience, the optimal consultation workflow is as follows:

### Before the Patient Arrives (10-15 minutes)

1. Open the patient's photo (received by email in advance or taken at the preliminary visit).
2. Create 2-3 option plans in DocPats:
   - `[Пациент] — консервативный`
   - `[Пациент] — умеренный`
   - `[Пациент] — агрессивный`
3. Place the points in each one in advance and save.

### During the Consultation (30-40 minutes)

1. Explain the possibilities and limitations of the procedure to the patient without visualization.
2. Open DocPats on a large monitor (at least 24").
3. Show the **editor** with the points in place — explain the anatomy.
4. Switch to **Before/After** — let the patient play with the slider.
5. Show **all 3 options** in sequence. Allow 5-10 minutes to discuss each one.
6. Discuss the patient's expectations and concerns.
7. Choose the final option together.

### After the Consultation (5 minutes)

1. Export the final plan in 3 formats (before / after / side-by-side) as JPG at 90%.
2. Save them in the patient's electronic medical record.
3. Print the side-by-side image for the patient's physical file.
4. Attach it to the informed consent with the patient's signature: "_I have seen a simulation of the expected result and understand that it is an approximate visualization_".
5. On the day of surgery (or the day before), open the final plan in DocPats for a fresh review with the team.

---

## Version Roadmap

The current version (MVP) is the basic feature set.

### v2.0 "Assisted" (planned for the next 3-4 weeks)

- **Automatic facial landmarking** via MediaPipe Face Mesh — 468 anatomical landmarks appear automatically when a plan is opened
- **Point groups** — show/hide the nose / lips / eyes / brows separately
- **Calibration** — specify the interpupillary distance and obtain all measurements in millimeters
- **Medical measurements** — nasofrontal angle, nasolabial angle, tip projection (Goode's ratio), alar base width
- **Symmetry lock** — mirroring the right half onto the left
- **Nasal surgery presets** — pre-configured point sets for hump reduction / tip refinement / nostril narrowing
- **Mask protection** — deformation automatically leaves the hair and background untouched

### v3.0 "Professional"

- **Liquify brush** — an interactive Photoshop-style tool in addition to points
- **Reference library** — a database of "target noses" for rapid matching
- **Multi-view** — 3-5 views in a single plan, with synchronized deformation
- **PDF report** for the patient with the clinic logo, measurements, and consent text
- **Consultation mode** — a fullscreen UI for presentation

### v4.0 "3D"

- 2D→3D reconstruction via ML
- 3D mesh editing
- AR preview on the patient's smartphone

---

_This document was prepared by the DocPats editorial team under the supervision of Dr. Ismailov, April 2026._

<!-- translated-from-ru: 65848d708c47ec27f7c2babbb9fcaac9b390bb72 -->
