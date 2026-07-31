# Clinic

The clinic is enabled within the same account as the physician's office — no data migration is required. Management is located in the `/clinic` section; staff members sign in through `/clinic/staff-login` and work in the `/clinic/employee` zone.

## Nine roles

Permissions are granted not on an "admin or not admin" basis, but by role, and each role covers its own scope of tasks:

- **owner** and **administrator** — full access to all clinic sections;
- **manager** — nearly everything except finances and owner settings;
- **physician** — consultations, patient charts, case conferences, telemedicine, knowledge base;
- **nurse** — close to the physician's scope, but with a narrower set of sections;
- **receptionist** — schedule, appointments, patients, handling calls and inquiries;
- **accountant** — invoices, payments, financial reports, payroll calculation, financial analytics;
- **pharmacist** — pharmacy, inventory, prescriptions, suppliers, purchase requests;
- **marketer** — clinic website, reviews, inquiries, articles, analytics.

There are forty sections in total, and for each one the permission comes in three types: **read**, **modify**, **delete**. A role is a template; permissions for an individual staff member can be expanded or restricted on top of the role.

**A role higher than one's own cannot be assigned** — a receptionist cannot make themselves an administrator, even if they reach the form. This is verified on the server, not merely hidden in the interface.

## What is maintained in the clinic

- **Staff** — invitations, roles, each physician's schedule and calendar.
- **Structure** — departments, rooms, equipment.
- **Services** and price list.
- **Pharmacy and inventory** — dispensing, purchase requests, suppliers, reports.
- **Case conferences** — collaborative case review.
- **Telemedicine**.
- **Knowledge base** — internal materials for staff.
- **Announcements** for staff.
- Patient **reviews** and **inquiries** from the website.
- **Analytics** on clinic operations.

## Patients in the clinic

**A patient is registered by a receptionist or an administrator, not by a physician.** This differs from a solo physician's office, where the physician adds the patient personally.

Who can do what with a patient's record:

- **owner** and **administrator** — create, modify, delete;
- **receptionist** — create and modify, but not delete;
- **physician** and **nurse** — view the record only. They cannot register a patient, but **they can maintain medical records in the patient's chart** — that is a separate permission;
- **manager** — view only;
- **accountant** and **pharmacist** — no access to patient records.

The patient list is at `/clinic/patients`, and patients are added at `/clinic/patients/new`. Staff members have the same pages within their own zone: `/clinic/employee/patients` and `/clinic/employee/patients/new`.

### What happens when a patient is added

The system checks whether this person is already known, and four outcomes are then possible:

1. **This patient already exists in this clinic** (matching phone number or email) — no new record is created; the existing one opens.
2. **The person has an account on the platform.** A record cannot simply be linked to someone else's account: first, the patient's consent must be confirmed. After confirmation, the record is linked to their account, and they see their entries in their own view.
3. **The person has an unissued card from another clinic.** This also requires confirmation of consent; afterward, a new patient card is issued with new temporary sign-in credentials.
4. **The person is not in the system** — a record is created, and if necessary a patient card with temporary sign-in credentials is issued so that they can log in and view their entries.

The second and third cases are the most frequent reason for a rejection when adding a patient: the system reports that this person is already known and asks for confirmation of consent. This is not an input error but a safeguard: another person's medical record must not be linked to an account without the knowledge of its owner.

### Access to the patient chart

The clinic requests access separately, and from there everything works the same as for a solo physician: the patient grants access to sections individually, may revoke access, and verification takes place with every request.

## Clinic website

The website is built within the platform; separate hosting is not required.

- **Public storefront** — `/clinics/<clinic address>`: services, physicians, reviews, receipt of inquiries.
- **Custom pages** — added in the builder and available at `/clinics/<clinic address>/<page>`.
- A page exists either as a **draft** or as **published**: until you publish it, no one outside can see it.

Management is at `/clinic/pages`, and the storefront preview is at `/clinic/public-page`. Inquiries from the website go to the inquiries section, not to email.

## Plans

- **Start — $99 per month.** Up to 5 physicians, 100 AI reviews and 100 discharge summaries per month, 30 materials, 1500 minutes of video. Commission 10%.
- **Business — $249 per month.** Up to 15 physicians, unlimited reviews and discharge summaries, 5000 minutes of video. Commission 7%. **Analytics** and **priority in recommendations** to patients are enabled.
- **Enterprise — $499 per month.** No limit on the number of physicians or on the other quotas. Commission 5%.

The higher the plan, the lower the commission per consultation: 10%, 7%, 5%. Analytics and priority in recommendations are available starting with Business.

## Data and access

Everything concerning access to patient charts works the same as for a solo physician: the patient grants access to sections individually and may revoke access, and verification takes place with every request.

One clinic's data is not accessible to another: the separation is enforced at the level of database queries, not merely in the interface. Every access to a patient chart is written to an audit log that cannot be modified or deleted.

<!-- translated-from-ru: eed93cd79b0b44eabd76fa019afc9e5959646060 -->
