import { useOutletContext } from "react-router-dom";

export default function useDoctorAccess() {
  const { verification } = useOutletContext();

  const level = verification?.level || "unverified";

  return {
    level,
    canUseAI: level === "basic" || level === "full",
    canUsePayments: level === "full",
    canUseTelemedicine: level === "full",
    isExpired: verification?.status === "expired",
    isPending: verification?.status === "pending",
  };
}
