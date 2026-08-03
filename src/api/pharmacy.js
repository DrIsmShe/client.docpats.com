// client/src/api/pharmacy.js
//
// API client for the pharmacy module.
// Mirrors api/clinic.js: full /api/v1/clinic paths, shared axios instance.
//
// Sections:
//   - Drug catalog (номенклатура)   -> /pharmacy/drug-items
//   - Suppliers (поставщики)         -> /pharmacy/suppliers
//   - Dispense (выдача)              -> /pharmacy/dispense
//   - Reports (отчёты)               -> /pharmacy/reports/dispense[.pdf]
//
// axios import MUST match api/clinic.js — confirmed: it uses "../axios".
import axios from "../axios";
import { track } from "../lib/analytics";
import {
  PHARMACY_DRUG_CREATED, PHARMACY_REQUISITION_CREATED,
  PHARMACY_REQUISITION_SUBMITTED, PHARMACY_DISPENSED, PHARMACY_REPORT_EXPORTED,
  count,
} from "../lib/events";

// ─────────────────────────────────────────────────────────────
// Drug catalog
// ─────────────────────────────────────────────────────────────
const DRUG_BASE = "/api/v1/clinic/pharmacy/drug-items";

// params: { search, category, isControlled, includeArchived, limit, skip }
export const getDrugItems = (params = {}) => axios.get(DRUG_BASE, { params });
export const getDrugItem = (id) => axios.get(`${DRUG_BASE}/${id}`);
export const createDrugItem = (data) =>
  axios.post(DRUG_BASE, data).then((r) => {
    track(PHARMACY_DRUG_CREATED);
    return r;
  });
export const updateDrugItem = (id, patch) =>
  axios.patch(`${DRUG_BASE}/${id}`, patch);
// soft archive (status → "archived")
export const archiveDrugItem = (id) => axios.delete(`${DRUG_BASE}/${id}`);
export const restoreDrugItem = (id) => axios.post(`${DRUG_BASE}/${id}/restore`);

// ─────────────────────────────────────────────────────────────
// Suppliers (поставщики)
// ─────────────────────────────────────────────────────────────
const SUPPLIER_BASE = "/api/v1/clinic/pharmacy/suppliers";

// params: { search, includeArchived, limit, skip }
export const getSuppliers = (params = {}) =>
  axios.get(SUPPLIER_BASE, { params });
export const getSupplier = (id) => axios.get(`${SUPPLIER_BASE}/${id}`);
export const createSupplier = (data) => axios.post(SUPPLIER_BASE, data);
export const updateSupplier = (id, patch) =>
  axios.patch(`${SUPPLIER_BASE}/${id}`, patch);
// soft archive (status → "archived")
export const archiveSupplier = (id) => axios.delete(`${SUPPLIER_BASE}/${id}`);
export const restoreSupplier = (id) =>
  axios.post(`${SUPPLIER_BASE}/${id}/restore`);

// ─────────────────────────────────────────────────────────────
// Requisitions (заявки отделений)
// ─────────────────────────────────────────────────────────────
const REQ_BASE = "/api/v1/clinic/pharmacy/requisitions";

// params: { status (CSV or single), departmentId, mine, limit, skip }
// -> { requisitions, total }  (NOTE: "requisitions", not "items")
export const getRequisitions = (params = {}) => axios.get(REQ_BASE, { params });
export const getRequisition = (id) => axios.get(`${REQ_BASE}/${id}`);
// body: { departmentId, items:[{drugItemId, qtyRequested(baseUnit), note}],
//         priority, note, submit }
export const createRequisition = (data) =>
  axios.post(REQ_BASE, data).then((r) => {
    // Число позиций в заявке — мера того, насколько плотно ведут склад.
    // Названия препаратов не отправляем.
    track(PHARMACY_REQUISITION_CREATED, { items: count(data?.items) });
    return r;
  });
// draft-only patch: { departmentId?, items?, priority?, note? }
export const updateRequisitionDraft = (id, patch) =>
  axios.patch(`${REQ_BASE}/${id}`, patch);
export const submitRequisition = (id) =>
  axios.post(`${REQ_BASE}/${id}/submit`).then((r) => {
    track(PHARMACY_REQUISITION_SUBMITTED);
    return r;
  });
export const cancelRequisition = (id) => axios.post(`${REQ_BASE}/${id}/cancel`);

// ─────────────────────────────────────────────────────────────
// Dispense (выдача)
// ─────────────────────────────────────────────────────────────
// body: { drugItemId, qty, target, requisitionId?, requisitionItemId?,
//         departmentId?, patientId?, prescriptionId?, note? }
// -> { dispenseLog, requisition|null }
export const dispense = (data) =>
  axios.post("/api/v1/clinic/pharmacy/dispense", data).then((r) => {
    // Выдача — конечное действие всего модуля аптеки. Кому и что выдали,
    // остаётся в системе; наружу идёт только количество позиций.
    track(PHARMACY_DISPENSED, { items: count(data?.items) });
    return r;
  });

// ─────────────────────────────────────────────────────────────
// Reports (отчёты)
// ─────────────────────────────────────────────────────────────
// params: { period, date, from, to, bucket, tz }
export const getDispenseReport = (params = {}) =>
  axios.get("/api/v1/clinic/pharmacy/reports/dispense", { params });

// PDF variant — returns a blob for download.
export const getDispenseReportPdf = (params = {}) =>
  axios
    .get("/api/v1/clinic/pharmacy/reports/dispense.pdf", {
      params,
      responseType: "blob",
    })
    .then((r) => {
      track(PHARMACY_REPORT_EXPORTED, { format: "pdf" });
      return r;
    });
