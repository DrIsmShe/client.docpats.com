# Clinic

The clinic is enabled within the same account as the physician's office—no data migration is required. Management is located in the `/clinic` section; staff members log in via `/clinic/staff-login` and work in the `/clinic/employee` area.

## Nine roles

Permissions are granted not on an "admin or not admin" basis, but by role, and each role covers its own scope of tasks:

- **owner** and **administrator**—full access to all clinic sections;
- **manager**—nearly everything except finances and owner settings;
- **physician**—consultations, patient charts, case conferences, telemedicine, knowledge base;
- **nurse**—close to the physician role, but with a narrower set of sections;
- **receptionist**—schedule, appointments, patients, handling calls and requests;
- **accountant**—invoices, payments, financial reports, payroll calculation, financial analytics;
- **pharmacist**—pharmacy, inventory, prescriptions, suppliers, purchase requests;
- **marketer**—clinic website, reviews, requests, articles, analytics.

There are forty sections in total, and for each one a permission may be of three types: **read**, **modify**, **delete**. A role is a template; for an individual staff member, permissions can be expanded or restricted on top of the role.

**A role higher than one's own cannot be assigned**—a receptionist cannot make themselves an administrator, even if they reach the form. This is verified on the server, not merely hidden in the interface.

## What is maintained in the clinic

- **Staff**—invitations, roles, each physician's schedule and calendar.
- **Structure**—departments, rooms, equipment.
- **Services** and the price list.
- **Pharmacy and inventory**—dispensing, purchase requests, suppliers, reports.
- **Case conferences**—joint review of a case.
- **Telemedicine**.
- **Knowledge base**—internal materials for staff.
- **Announcements** for staff.
- Patient **reviews** and **requests** from the website.
- **Analytics** on clinic operations.

## Patients in the clinic

**A patient is registered by the receptionist or administrator, not by the physician.** This differs from a solo physician's office, where the physician adds the patient personally.

Who can do what with a patient record:

- **owner** and **administrator**—create, modify, delete;
- **receptionist**—create and modify, but not delete;
- **physician** and **nurse**—view the record only. They cannot register a patient, but **they can maintain medical records in the patient's chart**—that is a separate permission;
- **manager**—view only;
- **accountant** and **pharmacist**—no access to records.

The patient list is at `/clinic/patients`, and registration is at `/clinic/patients/new`. Staff members have the same pages within their own area: `/clinic/employee/patients` and `/clinic/employee/patients/new`.

### What happens when adding a patient

The system checks whether this person is already known, and four outcomes are then possible:

1. **This patient already exists in this clinic** (a matching phone number or email)—no new record is created; the existing one opens.
2. **The person has an account on the platform.** A record cannot simply be linked to someone else's account: first, the patient's consent must be confirmed. After confirmation, the record is linked to their account, and they see the entries on their side.
3. **The person has an unissued card from another clinic.** This also proceeds through consent confirmation; afterward, a new patient card is issued with new temporary login credentials.
4. **The person is not in the system**—a record is created and, if necessary, a patient card with temporary login credentials is issued so that they can log in and see their entries.

The second and third cases are the most frequent reason for a rejection when adding a patient: the system reports that this person is already known and asks for consent to be confirmed. This is not an input error but a safeguard: another person's medical record must not be linked to an account without the knowledge of the account holder.

### Access to the patient chart

The clinic requests access separately, and from there everything works the same as for a solo physician: the patient grants access to sections individually, may revoke access, and verification occurs with every request.

## Clinic website

The website is built within the platform; separate hosting is not required.

- **Public storefront**—`/clinics/<адрес клиники>`: services, physicians, reviews, intake of requests.
- **Custom pages**—added in the builder and hosted at `/clinics/<адрес клиники>/<страница>`.
- A page exists either as a **draft** or as **published**: until you publish it, no one outside will see it.

Management is at `/clinic/pages`; the storefront preview is at `/clinic/public-page`. Requests from the website go to the requests section, not to email.

## Plans

- **Start—$99 per month.** Up to 5 physicians, 120 AI analyses and 90 discharge summaries per month, 25 materials, 1500 minutes of video.
- **Business—$249 per month.** Up to 15 physicians, 280 analyses and 300 discharge summaries, 80 materials, 5000 minutes of video. **Analytics** and **priority in recommendations** to patients are enabled.
- **Enterprise—$499 per month.** Up to 50 physicians: 480 analyses and 550 discharge summaries, 150 materials, 15 000 minutes of video. More than 50 physicians—under a separate agreement.

**The platform takes no percentage of consultations** on any plan—the patient's payment goes to the physician in full. The clinic pays only the subscription.

Analyses and discharge summaries are counted for the entire clinic on a monthly basis: each of them is a request to a language model, for which the platform pays in real money. The figures are set with a margin above the usual workload of a staff and are intended for contingencies, not to restrict your work. Analytics and priority in recommendations are available starting with Business.

## Data and access

Everything concerning access to patient charts works the same as for a solo physician: the patient grants access to sections individually and may revoke access, and verification occurs with every request.

One clinic's data is not accessible to another: the separation is enforced at the level of database queries, not only in the interface. Every access to a patient chart is written to an audit log that cannot be modified or deleted.

<!-- translated-from-ru: 93c8a522dc85661d192852ad3228b3c218a42e6e -->
