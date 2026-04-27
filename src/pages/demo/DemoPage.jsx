import React from "react";
import { Helmet } from "react-helmet-async";

export default function DemoPage() {
  return (
    <div className="container py-5">
      <Helmet>
        <title>Live Demo – DOCPATS MedConnect</title>
      </Helmet>
      <div className="text-center mb-4">
        <h1 className="fw-bold">Live Demo</h1>
        <p className="text-muted">
          This is a read-only demo of the doctor dashboard with sample data.
        </p>
      </div>
      <div className="shadow-lg rounded-4 overflow-hidden">
        <img
          src="/screens/doctor-dashboard.png"
          alt="Doctor dashboard demo"
          className="img-fluid"
        />
      </div>
      <p className="text-muted mt-3 text-center">
        For a full experience,{" "}
        <strong>
          create a free account or contact us for clinic onboarding.
        </strong>
      </p>
    </div>
  );
}
