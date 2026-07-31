# The Clinic: Who Does What

This section answers the question "who in the clinic performs this step." Permissions are distributed
by role, and in several places they diverge from expectations — those places are
flagged separately.

## The Patient Has Scheduled an Appointment and Arrived

1. **Create a patient chart** — front desk staff or administrator. The physician cannot do
   this: the chart is available to them in view-only mode.
2. **Create an appointment booking** — front desk staff, administrator, practice manager, or
   the physician themselves.
3. **Register the patient's arrival** — nurse or front desk staff. The physician has no access to
   arrival registration whatsoever.
4. **Manage the queue** — nurse and front desk staff. The physician can only view the queue.
5. **Conduct the visit and enter notes in the chart** — physician or nurse. Here the situation is
   reversed: they cannot create the chart, but they can maintain medical records.
6. **Telehealth visit** — a physician or front desk staff member can set it up; the nurse has view access.

**Not obvious:** the physician's schedule is modified by the physician themselves (or by the administrator),
while front desk staff can only **read** it. That is, front desk staff can reschedule an appointment,
but cannot change the physician's working hours.

## Prescriptions and the Pharmacy

The chain passes through three roles, and none of them covers it in full:

1. **Issue a prescription** — physician. The pharmacist may also modify prescriptions (with
   respect to dispensing), the administrator has view access only, and the practice manager is not involved.
2. **Dispense a medication** — pharmacist. Neither the physician nor the nurse has access to
   the pharmacy.
3. **Write off inventory** — pharmacist, nurse, or practice manager.
4. **Place an order with a supplier** — the request is created by the pharmacist or nurse;
   the administrator and practice manager can only view requests.
5. **Manage suppliers** — pharmacist; the accountant can view them for reconciliation.

**Not obvious:** the nurse can write off inventory and create purchase requests,
even though they have no access to the pharmacy itself. This reflects the separation between "consumables in
the exam room" and "the pharmacy as a medication warehouse."

## Case Conferences and Knowledge

- **Convene and lead a case conference** — physician or practice manager; the nurse
  joins in view-only mode. Front desk staff have no access.
- **Knowledge base**: populated by the practice manager and administrator; read by the physician,
  nurse, and front desk staff.

## Staff and Roles

- **Only the owner can invite a new staff member.** Neither the administrator nor
  the practice manager can send an invitation — this is the only permission in the entire clinic
  held exclusively by the owner.
- **Modify the staff roster** — owner and practice manager; the administrator and
  front desk staff can view the list.
- **A role higher than your own cannot be assigned** — this is verified on the server.
- Role permissions can be **adjusted selectively for an individual staff member**: expanded or
  restricted on top of the role, without changing the role itself.

## Finances

- **Invoices** are managed by front desk staff, the practice manager, and the administrator; the accountant has view access.
- **Payments** are processed by front desk staff and the administrator; the accountant has view access.
- **Financial reports** — accountant and owner. The administrator has view access only.
- **Payroll calculation** — accountant and owner, no one else.

**Not obvious:** the clinic administrator, who has access to nearly everything, has
no access to payroll at all.

## Website, Inquiries, Reviews

- **Clinic website** — owner, administrator, and marketing specialist.
- **Website inquiries** are handled by the marketing specialist, front desk staff, and practice manager.
- **Reviews** are managed by the marketing specialist and practice manager.
- **Services and price list** — administrator and practice manager.
- **Staff announcements** — administrator and practice manager.

## Analytics and the Audit Log

- **Clinic analytics** are available to the administrator, practice manager, and marketing specialist in
  view-only mode; in full — to the owner. On the Start plan, analytics are not enabled; they
  become available starting with Business.
- **Audit log** — owner; the administrator has view access. It is not available to the other roles.

## How Permissions Are Structured

For each of the forty sections, a permission comes in three levels, and they are nested:

- **read** — see the section;
- **modify** — includes reading;
- **delete** — includes modification.

Therefore, "front desk staff can modify records but not delete them" means that the delete
button will not be displayed to them, and if a request is submitted bypassing the interface, the server
will refuse it.

The role defines the default set; permissions can be modified for an individual staff member
on top of the role. Verification takes place on the server with every request, rather than merely hiding
buttons.

<!-- translated-from-ru: b45ae52b9a61ae2c1157b8761f80af45f310d5a9 -->
