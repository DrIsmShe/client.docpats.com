import React from "react";
import { Card } from "react-bootstrap";

const StatCard = ({ icon, label, value }) => {
  return (
    <div className="col-md-3 col-sm-6">
      <Card className="shadow text-center border-0 bg-light">
        <Card.Body>
          {icon}
          <h6 className="fw-bold">{label}</h6>
          <h3>{value ?? 0}</h3>
        </Card.Body>
      </Card>
    </div>
  );
};

export default StatCard;
