// client/src/pages/clinic/ClinicHubPage/ClinicHubPage.jsx
//
// Entry point for /clinic. Decides where the user goes based on whether
// they already have a clinic membership.

import React from "react";
import { useOutletContext, useNavigate, Link } from "react-router-dom";
import "./clinicHubPage.css";

export default function ClinicHubPage() {
  const context = useOutletContext();
  const navigate = useNavigate();

  // If user already has a clinic, redirect to dashboard
  React.useEffect(() => {
    if (context?.kind === "user" && context.hasClinic) {
      navigate("/clinic/dashboard", { replace: true });
    }
  }, [context, navigate]);

  if (context?.kind === "user" && context.hasClinic) {
    // Will redirect — render nothing during the brief redirect frame
    return null;
  }

  return (
    <div className="clinic-hub">
      <div className="clinic-hub-card">
        <div className="clinic-hub-icon">🏥</div>
        <h1 className="clinic-hub-title">Welcome to DocPats Clinic</h1>
        <p className="clinic-hub-subtitle">
          You don't have a clinic yet. Create one to start managing your team,
          appointments, and patients in a single workspace.
        </p>

        <div className="clinic-hub-actions">
          <Link to="/clinic/create" className="clinic-hub-btn-primary">
            Create a clinic
          </Link>
        </div>

        <div className="clinic-hub-divider">
          <span>or</span>
        </div>

        <div className="clinic-hub-secondary">
          <p>Already invited as a staff member?</p>
          <Link to="/clinic/staff-login" className="clinic-hub-btn-secondary">
            Sign in as employee
          </Link>
        </div>
      </div>

      <div className="clinic-hub-features">
        <div className="clinic-hub-feature">
          <span className="clinic-hub-feature-icon">👥</span>
          <h3>Manage your team</h3>
          <p>Invite doctors, nurses, receptionists with role-based access</p>
        </div>
        <div className="clinic-hub-feature">
          <span className="clinic-hub-feature-icon">📅</span>
          <h3>Smart scheduling</h3>
          <p>Book appointments, manage shifts, prevent conflicts</p>
        </div>
        <div className="clinic-hub-feature">
          <span className="clinic-hub-feature-icon">🔒</span>
          <h3>HIPAA-ready</h3>
          <p>Encrypted patient data, audit logs, secure communication</p>
        </div>
      </div>
    </div>
  );
}
