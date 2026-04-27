# DocPats Surgical Simulation — User Manual

**Document Version:** 1.0 (MVP)
**For:** Practicing plastic surgeons, ENT specialists, aesthetic medicine practitioners

---

## Table of Contents

1. [What Is Surgical Simulation](#what-is-surgical-simulation)
2. [2-Minute Workflow](#2-minute-workflow)
3. [Creating a New Plan](#creating-a-new-plan)
4. [Patient Photo Requirements](#patient-photo-requirements)
5. [Editor Interface](#editor-interface)
6. [Working with Control Points](#working-with-control-points)
7. [Advanced Warp Techniques](#advanced-warp-techniques)
8. [Patient Consultation](#patient-consultation)
9. [Export and Documentation](#export-and-documentation)
10. [Saving, Duplicating, Deleting](#saving-duplicating-deleting)
11. [Keyboard Shortcuts](#keyboard-shortcuts)
12. [Privacy and PHI](#privacy-and-phi)
13. [Troubleshooting](#troubleshooting)
14. [Workflow Recommendations](#workflow-recommendations)
15. [Version Roadmap](#version-roadmap)

---

## What Is Surgical Simulation

The Surgical Simulation module is a visualization tool that renders the anticipated outcome of a plastic surgery procedure on a pre-operative photograph of the patient. You upload a photo, place control points in the areas of planned correction, drag them to the desired positions — the image warps in real time, demonstrating the expected result.

The tool is based on 2D deformation (liquify / mesh warp) using a Radial Basis Function and Gaussian filter. All computations are performed in the browser using a WebWorker; patient data does not leave your device until the plan is saved to the secure DocPats server.

**Use this module for:**

- Pre-operative patient consultation prior to the surgical decision
- Expectation management
- Documenting the pre-operative plan
- Creating visual materials for patient informed consent
- Internal team discussion of surgical options

**This module does not replace:**

- Clinical patient assessment
- Radiological planning
- 3D scanning (where indicated)
- A legally binding medical opinion

The simulation result is an **approximate visualization**, not a guarantee of a specific surgical outcome.

---

## 2-Minute Workflow

**Step 1.** Main menu → "Simulation" → click the `+ New Plan` button in the upper right corner.

**Step 2.** In the dialog that opens, drag the patient photo onto the upload area or click it to browse. Accepted formats: JPG, PNG, WebP. Maximum file size: 20 MB. Minimum resolution: 200×200 px.

**Step 3.** On step 2 of the dialog, enter a plan name (e.g., "Smith J.A. — rhinoplasty, option 1") and, optionally, a patient identifier. Click "Create."

**Step 4.** The editor will open. Switch to "Add Point" mode (the `+●` icon in the top toolbar). Click on the areas of planned correction — control points will appear.

**Step 5.** Switch to "Select" mode (the cursor/arrow icon). Drag the blue circle of each point to the desired position. The image warps in real time.

**Step 6.** When the result matches your surgical plan, switch to the "Before / After" tab in the upper right corner. The slider displays the comparison.

**Step 7.** In the "Export" panel, select the format (JPG/PNG), mode (before / after / side-by-side), and click "Download." The file will be saved locally.

All changes are saved automatically every 2 seconds. The save indicator is located on the right side of the toolbar.

---

## Creating a New Plan

### Plan Naming

The plan name will be encrypted in the database and accessible only to you. Recommended naming structure:

`[Last Name, First Initial] — [procedure type], [option]`

Examples:

- `Johnson A.B. — rhinoplasty, conservative`
- `Johnson A.B. — rhinoplasty, aggressive`
- `Williams V.K. — blepharoplasty, both eyes`

Create multiple plans for a single patient when discussing **options** — conservative / moderate / aggressive. This allows the patient to compare them during consultation.

### Patient Identifier

This field is optional. You may use:

- The clinic's medical record number
- Initials
- An internal code

This field is also encrypted. Do not use the patient's full name if your clinic operates under GDPR/HIPAA requirements — a medical record number is sufficient.

### Searching and Sorting Plans

The plan list supports:

- **Search** by plan name or patient identifier (case-insensitive)
- **Sorting**: newest to oldest, oldest to newest, alphabetical

---

## Patient Photo Requirements

Simulation accuracy is critically dependent on the quality of the source photograph.

### Required Conditions

**Resolution.** Minimum 1000×1500 px on the short side. Optimal: 2000×3000 px. A standard smartphone photo is acceptable. Selfies and webcam photos are not recommended due to perspective distortion introduced by wide-angle lenses.

**Lighting.** Even, frontal lighting with no harsh shadows on the face. Avoid bright sunlight or backlighting. Optimal: a studio softbox or diffused daylight from a window.

**Camera-to-subject distance.** No closer than 1.5 meters. This minimizes perspective distortion of the nose and chin. Use a 50–85 mm focal length equivalent (on iPhone — use the 2× telephoto lens, not the wide-angle lens).

**Neutral facial expression.** The patient is not smiling; lips are closed but not compressed. Eyes are open, looking directly into the camera. No facial muscle contractions.

**Hair.** Pulled away from the face. The forehead, ears, and jawline must not be obscured. Ideally, hair should be pulled back.

**Jewelry and makeup.** Removed. Piercings, large earrings, and heavy lipstick all distort the reference image.

**Neutral background.** Light, solid color (gray, white, pale blue). No patterns, textures, or prominent objects behind the head.

### Angles/Views

For comprehensive surgical planning, three photographs of the same patient are recommended:

1. **Frontal view** — for assessment of symmetry, alar base width, and lip shape
2. **Profile view** (left and right) — for assessment of the nasofrontal angle, nasal dorsum, nasal tip, and chin
3. **Three-quarter view (3/4)** — for assessment of midface volume and malar eminence

**Note:** In the current version (MVP), each photo corresponds to a separate plan. Multi-view within a single plan is planned for the next release (v2).

### If the Photo Does Not Meet Requirements

Do not upload it. Ask the patient to be rephotographed, or take the photo yourself at the clinic. Deformation applied to a poor-quality photo generates false expectations, which leads to post-operative disputes.

---

## Editor Interface

### Page Header

- **"← Back to Plan List" arrow** — returns to the list of all plans.
- **Plan name and patient ID** — displayed below the arrow.
- **"Editor / Before–After" tabs** — switches the working mode.

### Top Editor Toolbar

Located in the upper right corner of the canvas. Elements from left to right:

**1. "Select" mode** (cursor/arrow icon). When active, highlighted in blue. In this mode:

- Click on the canvas background and drag — pans the view
- Click on a point's blue circle — selects and enables dragging
- Click on the yellow square — selects the point
- Alt + drag the yellow square — moves the anchor

**2. "Add Point" mode** (`+●` icon). When active, highlighted in blue. In this mode, clicking on the photo creates a new control point.

**3. Undo / Redo** (↶ / ↷ icons). Undoes and redoes the last action. Inactive when there is nothing to undo or redo. Hotkeys: Ctrl+Z / Ctrl+Shift+Z (Ctrl+Y).

**4. Zoom −** / percentage / **Zoom +**. Decreases and increases the zoom level. The current percentage is displayed in the center. Also available via the mouse scroll wheel — zoom is anchored to the cursor position (as in Figma).

**5. "Fit"** — fits the photo to the canvas size.

**6. "1:1"** — resets zoom to 100% and centers the photo.

**7. Save indicator** — the rightmost element:

- `●` pulsing blue — save in progress
- `✓` green — saved
- `✕` red — save error (check your internet connection)

### Bottom Information Bar

Displayed in the lower left corner. Shows:

- Photo resolution (e.g., `677×1200`)
- Number of warp points

### Point Properties Panel

Appears in the lower right corner when any point is selected. Contains:

- **Radius (Influence Radius)** — slider from 1–50%. Defines the deformation zone around the point. A smaller radius produces a more localized change. The value is expressed as a percentage of the image's long side. A dashed circle on the canvas visualizes the radius.

- **Strength** — slider from −1.00 to +1.00. At 1.00, the point pulls pixels in the direction of displacement at full force. At 0.50 — half force. At negative values, the point **repels** pixels away from the displacement direction (used for reverse-correction effects).

- **Close button × in the panel header** — deletes the point.

- **Hints** at the bottom of the panel:
  - `Alt + drag the square — shift the anchor`
  - `Del — delete`

---

## Working with Control Points

### Anatomy of a Control Point

Each point consists of four elements:

1. **Yellow square (Anchor)** — the original center of deformation. Typically corresponds to the initial click location. Does not move by default.

2. **Blue circle (Current)** — the target point. This is where you "want to move" the pixel located at the anchor position. This is the primary element for dragging.

3. **Dashed line** between anchor and current — the displacement vector. Shows the direction and magnitude of the deformation.

4. **Dashed circle around the anchor** — the point's zone of influence. The farther a pixel is from the center, the smaller its displacement. Beyond the circle boundary, no deformation occurs.

### Adding Points

1. Switch to `+●` mode.
2. Click on the areas where correction is planned. Each click creates a new point.
3. Upon creation, the point has anchor = current (i.e., zero displacement). Default radius is 8%, strength is 1.00.

### Moving a Point

1. Switch to "Select" mode.
2. Press and hold the left mouse button on the blue circle and drag it to the desired position.
3. The photo warps in real time as you drag.

### Fine Adjustment

1. Select the point (click the blue circle or yellow square).
2. In the lower right panel, adjust:
   - Radius — width of the zone of influence
   - Strength — deformation force

### Deleting a Point

Three methods:

- Select the point → click × in the properties panel
- Select the point → press Delete or Backspace on the keyboard
- Select the point → Escape clears the selection (does not delete)

### Point Limit

The technical maximum is 200 points per plan. In practice, 10–25 points are sufficient for a quality rhinoplasty simulation; for more complex procedures (full facial reconstruction) — up to 50–70.

---

## Advanced Warp Techniques

The current MVP engine uses global RBF deformation. This produces good results for localized changes but requires a specific technique for precise control.

### Technique 1 — Small Points for Localized Changes

Problem: a large radius deforms not only the target zone but also adjacent structures. Solution: use a small radius (2–4%) for precise changes.

**Example: reducing a nasal dorsal hump**

1. Create a point directly on the apex of the hump.
2. Set radius = 2–3%.
3. Strength = 1.00.
4. Drag the blue circle **vertically downward** by 3–5 pixels.
5. The hump is smoothed out; adjacent portions of the nasal dorsum are minimally affected.

### Technique 2 — Point Chains Along a Line

Problem: a single point produces circular (radial) distortion. For correction of a **linear** structure (nasal dorsum, jawline, vermilion border), a chain of points is required.

**Example: straightening the nasal dorsum**

1. Create 4–5 points along the nasal dorsum at intervals of 10–15% of the nasal length.
2. Each point: radius 2–3%.
3. Drag the blue circles so that they align along the desired straight line.
4. Result: the nasal dorsum is straightened; the rest of the face is unaffected.

### Technique 3 — Anchor Points

Problem: when deforming one zone, an adjacent area (e.g., the cheek near the nose) also shifts slightly due to RBF field propagation.

Solution: place **anchor points** along the perimeter of the correction zone. Anchor points have anchor = current (the blue circle is not moved), but they participate in the warp calculation and prevent neighboring pixels from shifting.

**Example: tip refinement without displacing the lips**

1. Create a working point on the nasal tip, radius 5%, drag upward.
2. Create an anchor point on the philtrum (between the nose and upper lip), radius 4%, **do not move**.
3. Create anchor points on either side of the alae, radius 3%, **do not move**.
4. The nasal tip is elevated; the philtrum and lips remain in place.

### Technique 4 — Negative Strength for "Expansion"

Sometimes the goal is not to shift a point but to "expand" a region (wider alar base, fuller lips).

1. Create a point at the center of the desired expansion zone.
2. Drag the blue circle **beyond** the desired boundary.
3. Set strength to **−0.3 to −0.5** (negative value).
4. Radius = 5–10%.
5. The zone is repelled from the point, producing an expansion effect.

### Technique 5 — Multiple Variants via Duplicates

For consultations, it is convenient to have several variants of the same procedure. Use the "Duplicate" function in the plan list:

1. Create a plan "Johnson A.B. — rhinoplasty, option 1 (conservative)."
2. Edit it: small displacements, subtle changes.
3. In the plan list → click "Copy" on that plan.
4. Rename the duplicate: "Johnson A.B. — rhinoplasty, option 2 (moderate)."
5. Open it, increase the deformations.
6. Repeat for "option 3 (aggressive)."

During the consultation, present all three variants to the patient sequentially.

### What to Avoid

**Do not combine large radius values with large displacements simultaneously.** This creates wave artifacts on the background and hairline.

**Do not deform the background.** If the hairline, ear, or shoulder falls within the radius — they will also be distorted. Place anchor points around the area to "lock" the background.

**Do not work at a heavily zoomed-out level.** Accurate point placement requires zoom at 100% or greater. Use the `+` and `1:1` buttons in the toolbar.

**Do not neglect symmetry.** If the patient requests nasal correction — deform both sides consistently. In the current MVP this is done manually (mirror mode will be available in v2).

---

## Patient Consultation

The "Before / After" tab is designed for **presenting results to the patient**. It features minimal technical interface elements and maximizes the visual comparison.

### Split Slider

The central image is divided by a vertical line with a round handle. By dragging it left and right, the patient sees:

- Left side — "Before" photo (original)
- Right side — "After" photo (with warp applied)

Corner labels read "BEFORE" and "AFTER" to avoid any confusion.

### Recommended Consultation Workflow

1. Open the plan in fullscreen (F11 in the browser for full screen).
2. Show the patient the "Editor" tab — explain exactly what you plan to change, using the points themselves as visual markers.
3. Switch to "Before / After" and let the patient operate the slider themselves.
4. Discuss — does this match their expectations?
5. If other variants exist (conservative / aggressive) — close the current plan and open the next one.
6. At the conclusion, select one variant as the final plan.
7. Export to PDF (or JPG + print) to attach to the informed consent documentation.

### What to Communicate to the Patient

The simulation is a **visualization of the anticipated result, not a guarantee**. The actual surgical outcome depends on:

- Individual tissue characteristics (skin thickness, elasticity, cartilage thickness)
- Healing and scarring process
- Surgical technique
- Patient compliance with post-operative instructions

A deviation of ±10–20% from the simulation is normal and does not constitute a surgical defect. Include this statement in your informed consent documentation.

---

## Export and Documentation

### "Export" Panel

Located on the right side of the "Before / After" tab.

### What to Export

**1. Pre-operative (original)** — the unmodified source photograph of the patient. Used for the medical record and as the "pre-op baseline" for comparison with the actual result.

**2. Post-operative (with warp)** — the photo with the warp applied. Used for patient presentation and plan documentation.

**3. Side-by-side: Before and After** — a side-by-side composite image with "BEFORE" and "AFTER" labels. The most convenient format for printing and for inclusion in informed consent documentation.

### Format

**JPG** — recommended for most use cases. Small file size, acceptable quality at 85–92%.

**PNG** — lossless compression, maximum quality. Use if the result will be further edited in Photoshop or printed at large format.

### JPG Quality

Slider from 40–100%. Recommendations:

- 60–70% — for email and messaging applications
- 80–90% — standard for document printing
- 95–100% — for archiving and publication

### Downloading

After configuring the parameters, click "Download." The file will be saved to your browser's Downloads folder with a name such as `plan-2026-04-24-rhinoplasty.jpg`.

### Documentation Recommendation

For each procedure, save the following to the patient's electronic medical record:

1. Original photograph (export "Before")
2. Simulated result (export "After")
3. Side-by-side composite (export "Side-by-side")
4. A screenshot of the editor with visible control points (via Print Screen) — to document exactly what was planned

This creates complete pre-op planning documentation and provides protection against post-operative disputes with the patient.

---

## Saving, Duplicating, Deleting

### Auto-Save

All changes (adding/removing points, modifying point parameters, dragging) are saved **automatically 2 seconds** after the last action. No manual action is required.

The save indicator in the top toolbar displays the current status:

- `●` pulsing blue — save in progress
- `✓` green — saved
- `✕` red — error (check your internet connection)

When the page is closed or you navigate to another tab, a forced save is triggered. No data is lost.

### Duplicating a Plan

In the plan list, each plan card has three buttons: "Open," "Copy," "Delete."

**Copy** creates a full duplicate of the plan with the same photo and all control points. The duplicate appears at the top of the list. Rename it before editing (e.g., append "(option 2)" to the name).

Used for:

- Creating multiple surgical variants
- Backing up a plan before experimental changes
- Transferring settings to a patient with similar anatomy

### Deleting a Plan

The "Delete" button prompts for confirmation. After confirmation:

- The plan is marked as deleted in the database (soft delete)
- The patient photo is removed from R2 storage within 24 hours (provided no other duplicates reference that photo)
- The plan disappears from the list

**Warning:** deletion cannot be undone. If you need a safeguard — duplicate the plan before deleting the original.

---

## Keyboard Shortcuts

Active anywhere on the page except in text input fields.

- **`Ctrl + Z`** — Undo
- **`Ctrl + Shift + Z`** or **`Ctrl + Y`** — Redo
- **`Delete`** or **`Backspace`** — Delete the selected point
- **`Escape`** — Clear selection + switch to "Select" mode
- **`Mouse wheel`** — Zoom to cursor position
- **`Alt + drag yellow square`** — Move the anchor of the selected point

Planned additions in future versions:

- `V` — Select mode
- `A` — Add mode
- `+` / `−` — Zoom
- `0` — Fit to view
- `1` — 100% zoom
- `Space + drag` — Temporary pan mode

---

## Privacy and PHI

DocPats Surgical Simulation has been developed in compliance with HIPAA (United States) and GDPR (European Union) requirements for patient medical data.

### What Is Encrypted

- **Plan name** — AES-256-GCM, encrypted in the database
- **Patient identifier** — AES-256-GCM, encrypted in the database
- **Photograph** — stored in R2 with server-side encryption; accessible only via an authorized session

### What Is Not Encrypted

- Control points (coordinates, radius, strength) — these do not constitute PHI under HIPAA, as they do not identify a patient independently of the photo and metadata
- Plan creation and update timestamps

### Access

- Only you, as the DocPats account holder, have access to your plans
- Neither Anthropic nor the DocPats team can read the contents of your plans
- In the event of a court order — encrypted data is provided; the encryption key remains with the clinic

### Recommendations

**Use strong passwords and enable 2FA for your DocPats account.** A compromised account means compromised patient PHI.

**Do not save screenshots to an unprotected local disk** without PIN/password protection. Exported JPG/PNG files are not automatically encrypted.

**Before decommissioning a clinic computer**, ensure that the browser cache does not contain copies of patient photos. Use browser privacy tools (e.g., Clear Cache in Chrome).

**When working with European patients** (GDPR) — obtain written consent for the processing of biometric data **before** uploading any photos to the system.

---

## Troubleshooting

### Photo does not upload; the message "Image cannot be read" appears

**Cause 1:** Unsupported format. Only JPG, PNG, and WebP are supported. HEIC (iPhone native format) **is not supported**.

**Solution:** Convert HEIC to JPG (using Photos on Mac or an online converter).

**Cause 2:** The photo is smaller than 200×200 px.

**Solution:** Use the original full-resolution photo, not a thumbnail or preview.

**Cause 3:** The file is corrupted, or it is not a real image file (e.g., a .docx file renamed to .jpg).

**Solution:** Open the file in your default image viewer (Photos, Preview). If it does not open — the file is corrupted; use a different file.

### The editor loads but the canvas is blank

**Cause:** A CORS error occurred while loading the photo from R2 storage. This typically occurs on the first load, when Cloudflare has not yet cached the correct headers.

**Solution:** Wait 30 seconds and perform a Hard Refresh (Ctrl+Shift+R). If the issue persists — contact DocPats technical support.

### Points appear but cannot be dragged

**Cause:** The browser is not receiving pointer capture events. This most commonly occurs with an outdated browser or specific tablet/stylus settings.

**Solution:** Update your browser to the latest version (Chrome 120+, Firefox 115+, Edge 120+, Safari 17+). On a touchpad — use a mouse instead.

### Warp is not applied to the photo (points move but the photo does not change)

**Cause:** The WebWorker failed to load. Chrome may block the worker when device memory is low.

**Solution:** Close unnecessary tabs and reload the editor (F5). If the issue recurs — try a different browser or a computer with 8 GB+ RAM.

### Save indicator is red (✕)

**Cause:** No connection to the DocPats server, or the session has expired.

**Solution:** Check your internet connection. If the connection is normal — reload the page (changes made within the last 2 seconds may be lost; everything else has been saved).

### Plan list is empty even though I have created plans

**Cause:** You are logged in under a different account, or you have inadvertently switched to a dev/staging environment.

**Solution:** Verify the URL (it should be your clinic's production URL) and the email address in your account settings.

### The exported photo has low resolution

**Cause:** You are using a preview version of the photo (1200 px max) rather than the full-resolution original.

**Solution:** When exporting, the system automatically applies the warp to the full-resolution image — wait for the loading indicator to disappear (in the upper right corner of the export panel). Do not click "Download" until the loading indicator is gone.

### The editor is slow or laggy

**Cause:** Plans with 50+ points and photos at 4000×6000 px become computationally intensive for low-end devices.

**Solution:**

- Work in Fit mode (a smaller preview is computationally less demanding)
- Reduce the number of points (merge points that are close together)
- Use a device with a dedicated GPU

---

## Workflow Recommendations

Based on practical experience, the optimal consultation workflow is as follows:

### Before the Patient Arrives (10–15 minutes)

1. Open the patient's photo (received by email in advance or taken at a preliminary visit).
2. Create 2–3 plan variants in DocPats:
   - `[Patient] — conservative`
   - `[Patient] — moderate`
   - `[Patient] — aggressive`
3. Place the points in each plan in advance and save.

### During the Consultation (30–40 minutes)

1. Explain the possibilities and limitations of the procedure to the patient without any visuals.
2. Open DocPats on a large monitor (minimum 24").
3. Show the patient the **editor** with the placed points — explain the relevant anatomy.
4. Switch to **Before/After** — let the patient interact with the slider.
5. Show **all 3 variants** sequentially. Allow 5–10 minutes for discussion of each.
6. Discuss the patient's expectations and concerns.
7. Select the final variant together.

### After the Consultation (5 minutes)

1. Export the final plan in 3 formats (before / after / side-by-side) as JPG at 90% quality.
2. Save to the patient's electronic medical record.
3. Print the side-by-side image for the patient's physical file.
4. Attach to the informed consent form with the patient's signature: *"I have reviewed the simulation of the anticipated result and understand that this is an approximate visualization."*
5. On the day of surgery (or the day before) — open the final plan in DocPats for a fresh review with the surgical team.

---

## Version Roadmap

The current version (MVP) represents the base feature set.

### v2.0 "Assisted" (planned within the next 3–4 weeks)

- **Automatic facial landmark detection** via MediaPipe Face Mesh — 468 anatomical landmarks appear automatically when a plan is opened
- **Point groups** — show/hide nose / lips / eyes / eyebrows independently
- **Calibration** — specify the interpupillary distance and receive all measurements in millimeters
- **Medical measurements** — nasofrontal angle, nasolabial angle, tip projection (Goode's ratio), alar base width
- **Symmetry lock** — mirrors the right half onto the left
- **Nasal surgery presets** — pre-configured point sets for hump reduction / tip refinement / nostril narrowing
- **Mask protection** — deformation automatically excludes the hair and background

### v3.0 "Professional"

- **Liquify brush** — interactive Photoshop-style tool in addition to control points
- **Reference library** — a database of "target noses" for rapid matching
- **Multi-view** — 3–5 angles within a single plan with synchronized deformation
- **PDF report** for the patient, including the clinic logo, measurements, and consent text
- **Consultation mode** — fullscreen UI for presentation

### v4.0 "3D"

- 2D-to-3D reconstruction via ML
- 3D mesh editing
- AR preview on the patient's smartphone

---

*Document prepared by the DocPats editorial team under the direction of Dr. Ismailov, April 2026.*