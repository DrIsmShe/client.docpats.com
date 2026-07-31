# Clinic

The clinic module is activated within the same account as the physician's office—no data migration is required. Administration is located in the `/clinic` section; staff members log in through `/clinic/staff-login` and work in the `/clinic/employee` area.

## Nine roles

Permissions are not granted on an "admin or non-admin" basis but by role, and each role covers its own scope of tasks:

- **owner** and **administrator**—full access to all clinic sections;
- **manager**—nearly everything except finances and owner settings;
- **physician**—consultations, patient charts, case conferences, telemedicine, knowledge base;
- **nurse**—close to the physician role, but with a narrower set of sections;
- **receptionist**—schedule, appointments, patients, handling calls and inquiries;
- **accountant**—invoices, payments, financial reports, payroll calculation, financial analytics;
- **pharmacist**—pharmacy, inventory, prescriptions, suppliers, purchase requests;
- **marketer**—clinic website, reviews, inquiries, articles, analytics.

There are forty sections in total, and for each one a permission may be of three kinds: **read**, **modify**, **delete**. A role is a template; permissions for an individual staff member can be expanded or restricted on top of the role.

**A role higher than one's own cannot be assigned**—a receptionist cannot make himself or herself an administrator, even if he or she reaches the form. This is verified on the server, not merely hidden in the interface.

## What is maintained in the clinic

- **Staff**—invitations, roles, each physician's schedule and calendar.
- **Structure**—departments, examination rooms, equipment.
- **Services** and price list.
- The clinic's **patients** and their charts.
- **Pharmacy and inventory**—dispensing, purchase requests, suppliers, reports.
- **Case conferences**—collaborative case review.
- **Telemedicine**.
- **Knowledge base**—internal materials for staff.
- **Announcements** for staff.
- Patient **reviews** and **inquiries** from the website.
- **Analytics** on clinic operations.

## Clinic website

The website is built within the platform; separate hosting is not required.

- **Public storefront**—`/clinics/<clinic address>`: services, physicians, reviews, inquiry intake.
- **Custom pages**—added in the page builder and hosted at `/clinics/<clinic address>/<page>`.
- A page exists either as a **draft** or as **published**: until you publish it, no one outside will see it.

Administration is at `/clinic/pages`; the storefront preview is at `/clinic/public-page`. Inquiries from the website go to the inquiries section, not to email.

## Plans

- **Start—$99 per month.** Up to 5 physicians, 100 AI case reviews and 100 discharge summaries per month, 30 materials, 1500 minutes of video. 10% commission.
- **Business—$249 per month.** Up to 15 physicians, unlimited case reviews and discharge summaries, 5000 minutes of video. 7% commission. **Analytics** and **priority in patient recommendations** are enabled.
- **Enterprise—$499 per month.** No limit on the number of physicians or on the remaining quotas. 5% commission.

The higher the plan, the lower the commission per consultation: 10%, 7%, 5%. Analytics and priority in recommendations are available starting with Business.

## Data and access

Everything concerning access to patient charts works the same way as for a solo physician: the patient grants access to sections individually and may revoke access, and verification occurs with every request.

One clinic's data is inaccessible to another: the separation is enforced at the level of database queries, not merely in the interface. Every access to a patient chart is written to an audit log that cannot be modified or deleted.

<!-- translated-from-ru: 8aa4b76798723b01abccfa5dc5d1e527f4b19eb9 -->
