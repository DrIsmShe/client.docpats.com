# Medical History and Examination Templates

This section explains how a patient chart is populated from the inside and how to stop typing the same content by hand.

## What a medical history consists of

The chart is not maintained as continuous text, but in sections familiar to any physician. Each section is its own list of entries: you can add an entry, open it in full, or delete one you do not need.

Sections:

- complaints;
- anamnesis morbi — history of the present illness;
- anamnesis vitae — past medical and personal history;
- status praesens — general condition;
- status localis — local findings;
- laboratory test results;
- CT reports;
- MRI reports;
- ultrasound reports;
- recommendations.

Entries accumulate: at a follow-up visit you add a new one, while previous entries remain in place and stay visible in the list. This gives the chart a chronology rather than a single overwritten version.

Adding a medical history begins on the page
`/dp/add-patient-medical-history/<id пациента>`.

## Imaging and test results

Separately from the text sections, results of instrumental studies are attached to the patient — with a file and a description. Supported studies include:

radiography, CT, MRI, ultrasound, Doppler, ECG, echocardiography, EEG, Holter monitoring, spirometry, coronary angiography, angiography, PET, SPECT, gastroscopy, capsule endoscopy, gynecologic examination — and laboratory tests.

The upload page address follows the same pattern for all types:

```
/dp/add-<вид>-scan-upload/<тип пациента>/<id пациента>
```

Laboratory results are added on their own page —
`/dp/add-labtest-results/<тип пациента>/<id пациента>`.

**The patient type in the address** reflects that same division into registered and private patients: the same pages serve both types, so the link must indicate whose chart is open.

## Templates: so you do not retype the same content

Each type of study has **four parts**, and templates can be prepared for each of them:

1. **Study name** — what the procedure is called in your practice;
2. **Protocol** — a description of the findings;
3. **Conclusion** — the interpretation;
4. **Recommendations** — what to do next.

A template is created once and then inserted into a new examination rather than retyped. A template can be viewed, edited, and deleted.

The addresses follow a uniform pattern:

```
/dp/add-<вид>-scan-template-nameofexam      создать заготовку названия
/dp/add-<вид>-scan-template-report          создать заготовку протокола
/dp/add-<вид>-scan-template-diagnosis       создать заготовку заключения
/dp/add-<вид>-scan-template-recomandation   создать заготовку рекомендаций

/dp/list-<вид>-scan-template-<часть>/<id>     список заготовок
/dp/update-<вид>-scan-template-<часть>/<id>   изменить
/dp/detail-<вид>-scan-template-<часть>/<id>   посмотреть целиком
```

For CT, for example: `/dp/add-ct-scan-template-report`.

## How this saves time in practice

Examinations of the same type resemble one another: the findings change, but the structure of the description stays the same. Once you have prepared a protocol and standard conclusions, you assemble each examination from ready-made parts and edit only what differs for the individual patient.

The templates are yours: they are tied to your account and accumulate as you work.

## What happens to this data afterward

Medical history entries and study results are the actual content of the chart, which:

- is visible to a registered patient in their portal, in those sections they have opened to you;
- can be attached to an AI review in the `/diagnostics` section — but only after the material has been de-identified and consent to processing has been confirmed;
- is preserved when a patient is archived: the chart leaves the active list in its entirety and returns unchanged.

<!-- translated-from-ru: c35d98297e0ec0d214bae77ef68c134e1f715409 -->
