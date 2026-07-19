import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link, useParams } from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { useTranslation } from "react-i18next";
import OnboardingChecklist from "../../../components/shared/OnboardingChecklist";

/* ─────────────────────────── STYLES ─────────────────────────── */
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

:root {
  --cream:        #faf8f4;
  --cream2:       #f3efe8;
  --parchment:    #ede8df;
  --ink:          #1c1917;
  --ink2:         #44403c;
  --ink3:         #78716c;
  --teal:         #0f766e;
  --teal-mid:     #0d9488;
  --teal-light:   #14b8a6;
  --teal-pale:    #f0fdfa;
  --teal-border:  #99f6e4;
  --green:        #16a34a;
  --green-pale:   #f0fdf4;
  --green-border: #bbf7d0;
  --yellow:       #b45309;
  --yellow-pale:  #fffbeb;
  --yellow-border:#fde68a;
  --red:          #dc2626;
  --red-pale:     #fef2f2;
  --red-border:   #fca5a5;
  --blue:         #1d4ed8;
  --blue-pale:    #eff6ff;
  --blue-border:  #bfdbfe;
  --border:       #e7e2d8;
  --border2:      #d6d0c6;
  --sh-xs:  0 1px 3px rgba(28,25,23,.05);
  --sh-sm:  0 2px 8px rgba(28,25,23,.07),0 1px 3px rgba(28,25,23,.04);
  --sh-md:  0 8px 24px rgba(28,25,23,.09),0 2px 8px rgba(28,25,23,.04);
  --radius:    16px;
  --radius-sm: 10px;
  --tr: all .22s cubic-bezier(.4,0,.2,1);
  --font-d: 'Lora', Georgia, serif;
  --font-b: 'Plus Jakarta Sans', system-ui, sans-serif;
}

/* ── WRAP ── */
.hmp { background:var(--cream); min-height:100vh; font-family:var(--font-b); color:var(--ink); }

/* ── HERO ── */
.hmp-hero {
  background: linear-gradient(150deg,#0c4a6e 0%,#0f766e 60%,#065f46 100%);
  padding: 52px 40px 100px;
  position: relative; overflow: hidden;
}
.hmp-hero::before {
  content:''; position:absolute; inset:0;
  background:
    radial-gradient(ellipse 700px 400px at 90% 40%,rgba(20,184,166,.18) 0%,transparent 65%),
    radial-gradient(ellipse 300px 500px at 5% 110%,rgba(6,95,70,.5) 0%,transparent 60%);
  pointer-events:none;
}
.hmp-hero::after {
  content:''; position:absolute; bottom:-1px; left:0; right:0;
  height:64px; background:var(--cream);
  clip-path: ellipse(55% 100% at 50% 100%);
}
.hmp-hero-inner {
  max-width:1000px; margin:0 auto; position:relative; z-index:1;
  display:flex; align-items:flex-end; gap:24px; flex-wrap:wrap;
}
.hmp-hero-photo {
  width:110px; height:110px; border-radius:22px; overflow:hidden;
  border:3px solid rgba(255,255,255,.35); box-shadow:0 8px 32px rgba(0,0,0,.2);
  flex-shrink:0; background:rgba(255,255,255,.1);
}
.hmp-hero-photo img { width:100%; height:100%; object-fit:cover; display:block; }
.hmp-hero-photo-init {
  width:100%; height:100%; display:flex; align-items:center; justify-content:center;
  font-family:var(--font-d); font-size:36px; font-weight:700; color:rgba(255,255,255,.7);
}
.hmp-hero-info { flex:1; min-width:0; }
.hmp-hero-tag {
  display:inline-flex; align-items:center; gap:7px;
  background:rgba(255,255,255,.12); backdrop-filter:blur(8px);
  border:1px solid rgba(255,255,255,.22); color:rgba(255,255,255,.88);
  font-size:11px; font-weight:600; letter-spacing:.1em; text-transform:uppercase;
  padding:5px 14px; border-radius:100px; margin-bottom:14px;
}
.hmp-hero-tag::before { content:''; width:6px; height:6px; background:#5eead4; border-radius:50%; }
.hmp-hero-name {
  font-family:var(--font-d); font-size:clamp(22px,3vw,36px);
  font-weight:700; color:white; line-height:1.2; letter-spacing:-.015em; margin:0 0 10px;
}
.hmp-hero-chips { display:flex; gap:10px; flex-wrap:wrap; }
.hmp-hero-chip {
  background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.18);
  color:rgba(255,255,255,.82); font-size:12px; font-weight:500;
  padding:4px 12px; border-radius:100px;
}

/* ── BODY LAYOUT ── */
.hmp-body {
  max-width:1400px;  padding:0 32px 80px;
  position:relative; z-index:2;
  display:grid; grid-template-columns:260px 1fr; gap:24px; align-items:start;
}
@media(max-width:900px){
  .hmp-body{
    grid-template-columns: 1fr;
    padding: 0 16px 60px;
    margin-top: 16px;
  }
  .hmp-sidebar{
    position: static !important;
    top: auto !important;
    width: 100%;
  }
  .hmp-body{
    margin-top: 16px; /* вместо -44px */
  }
}

/* ── SIDEBAR ── */
.hmp-sidebar { position:sticky; top:24px; }
.hmp-side-card {
  background:white; border:1px solid var(--border);
  border-radius:var(--radius); box-shadow:var(--sh-sm); overflow:hidden; margin-bottom:16px;
}
.hmp-side-top {
  padding:24px 20px 16px;
  background:linear-gradient(180deg,var(--cream2) 0%,white 100%);
  border-bottom:1px solid var(--border);
  display:flex; flex-direction:column; align-items:center; text-align:center;
}
.hmp-side-avatar {
  width:88px; height:88px; border-radius:50%; object-fit:cover;
  border:3px solid white; box-shadow:0 4px 16px rgba(15,118,110,.15); margin-bottom:12px;
}
.hmp-side-name { font-family:var(--font-d); font-size:15px; font-weight:600; color:var(--ink); margin-bottom:2px; }
.hmp-side-co   { font-size:12px; color:var(--ink3); }
.hmp-side-badge {
  display:inline-flex; align-items:center; gap:4px;
  font-size:11px; font-weight:600; color:var(--teal);
  background:var(--teal-pale); border:1px solid var(--teal-border);
  padding:3px 10px; border-radius:100px; margin-top:8px;
}
.hmp-tab-nav { padding:8px 0; }
.hmp-tab-btn {
  display:flex; align-items:center; gap:10px;
  width:100%; padding:10px 18px; font-size:13px; font-weight:600;
  color:var(--ink3); background:none; border:none; border-left:3px solid transparent;
  cursor:pointer; transition:var(--tr); font-family:var(--font-b); text-align:left;
}
.hmp-tab-btn:hover { color:var(--ink); background:var(--cream2); border-left-color:var(--border2); }
.hmp-tab-btn.act  { color:var(--teal); background:var(--teal-pale); border-left-color:var(--teal); }
.hmp-tab-icon { font-size:16px; flex-shrink:0; width:20px; text-align:center; }

/* ── CARD ── */
.hmp-card {
  background:white; border:1px solid var(--border);
  border-radius:var(--radius); box-shadow:var(--sh-sm); overflow:hidden; margin-bottom:20px;
}
.hmp-card-head {
  padding:18px 24px 14px; border-bottom:1px solid var(--border);
  background:var(--cream2); display:flex; align-items:center; justify-content:space-between; gap:12px;
}
.hmp-card-head-title { font-family:var(--font-d); font-size:17px; font-weight:600; color:var(--ink); }
.hmp-card-body { padding:24px; }

/* ── OVERVIEW COVER ── */
.hmp-cover {
  height:140px;
  background:linear-gradient(120deg,#0c4a6e,#0f766e,#065f46);
  border-radius:var(--radius) var(--radius) 0 0;
}
.hmp-ov-inner { padding:0 28px 28px; margin-top:-56px; }
.hmp-ov-avatar {
  width:112px; height:112px; border-radius:50%;
  border:4px solid white; object-fit:cover;
  box-shadow:0 8px 28px rgba(0,0,0,.18); display:block; margin-bottom:14px;
}
.hmp-ov-name { font-family:var(--font-d); font-size:26px; font-weight:700; color:var(--ink); margin:0 0 4px; }
.hmp-ov-co   { font-size:15px; color:var(--ink3); margin-bottom:8px; }
.hmp-ov-country {
  display:inline-flex; align-items:center; gap:5px;
  font-size:11px; font-weight:700; letter-spacing:.07em; text-transform:uppercase;
  background:var(--teal-pale); color:var(--teal);
  border:1px solid var(--teal-border); padding:4px 14px; border-radius:100px;
}
.hmp-info-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px 20px; margin-top:24px; }
@media(max-width:600px){ .hmp-info-grid{ grid-template-columns:1fr; } }
.hmp-info-item {
  background:var(--cream2); border:1px solid var(--border);
  border-radius:var(--radius-sm); padding:14px 18px; transition:var(--tr);
}
.hmp-info-item:hover { border-color:var(--teal-border); }
.hmp-info-lbl { font-size:10px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--ink3); margin-bottom:6px; }
.hmp-info-val { font-size:14px; font-weight:600; color:var(--ink); line-height:1.4; }
.hmp-info-sub { font-size:12px; color:var(--ink3); margin-top:3px; }

/* ── ABOUT ── */
.hmp-about-text {
  font-family: var(--font-d);
  font-size: 15px;
  font-style: italic;
  color: var(--ink2);
  line-height: 1.8;
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  max-width: 100%;
}

/* ── FORMS ── */
.hmp-row { display:grid; grid-template-columns:180px 1fr; gap:16px; align-items:start; margin-bottom:20px; }
@media(max-width:640px){ .hmp-row{ grid-template-columns:1fr; gap:6px; } }
.hmp-lbl { font-size:13px; font-weight:600; color:var(--ink2); padding-top:10px; }
.hmp-field {}
.hmp-input,.hmp-select,.hmp-textarea {
  width:100%; padding:10px 14px;
  background:var(--cream2); border:1.5px solid var(--border);
  border-radius:10px; font-family:var(--font-b); font-size:13px;
  color:var(--ink); transition:var(--tr); outline:none; box-sizing:border-box;
}
.hmp-input::placeholder,.hmp-textarea::placeholder { color:var(--ink3); }
.hmp-input:focus,.hmp-select:focus,.hmp-textarea:focus {
  border-color:var(--teal-mid); background:white; box-shadow:0 0 0 3px rgba(15,118,110,.1);
}
.hmp-select {
  appearance:none; cursor:pointer;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2378716c' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right 12px center; padding-right:32px;
}
.hmp-textarea { resize:vertical; min-height:90px; }
.hmp-yr-row { display:flex; align-items:center; gap:10px; }
.hmp-yr-row .hmp-input { width:100px; flex-shrink:0; }
.hmp-yr-sep { color:var(--ink3); font-weight:600; }

/* phone override */
.hmp-field .react-tel-input .form-control {
  width:100%!important; background:var(--cream2)!important;
  border:1.5px solid var(--border)!important; border-radius:10px!important;
  font-family:var(--font-b)!important; font-size:13px!important;
  height:40px!important; color:var(--ink)!important;
}
.hmp-field .react-tel-input .form-control:focus {
  border-color:var(--teal-mid)!important; background:white!important;
  box-shadow:0 0 0 3px rgba(15,118,110,.1)!important;
}
.hmp-field .react-tel-input .flag-dropdown {
  background:var(--cream2)!important; border:1.5px solid var(--border)!important;
  border-right:none!important; border-radius:10px 0 0 10px!important;
}
.hmp-phone-err { font-size:11px; color:var(--red); margin-top:5px; font-weight:500; }

/* photo upload */
.hmp-photo-row { display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
.hmp-photo-thumb { width:64px; height:64px; border-radius:12px; object-fit:cover; border:2px solid var(--border); }
.hmp-file-btn {
  display:inline-flex; align-items:center; gap:7px;
  font-size:13px; font-weight:600; padding:8px 18px; border-radius:100px;
  border:1.5px solid var(--teal-border); color:var(--teal); background:var(--teal-pale);
  cursor:pointer; transition:var(--tr); font-family:var(--font-b);
}
.hmp-file-btn:hover { background:var(--teal); color:white; border-color:var(--teal); }
.hmp-file-nm { font-size:12px; color:var(--ink3); }

/* avatar grid */
.hmp-av-grid { display:flex; flex-wrap:wrap; gap:8px; padding:16px; background:var(--cream2); border:1px solid var(--border); border-radius:var(--radius-sm); }
.hmp-av-opt { width:38px; height:38px; border-radius:50%; object-fit:cover; cursor:pointer; border:2px solid transparent; transition:var(--tr); }
.hmp-av-opt:hover { border-color:var(--teal-light); transform:scale(1.1); }
.hmp-av-opt.sel { border-color:var(--teal); box-shadow:0 0 0 3px rgba(15,118,110,.2); transform:scale(1.12); }

/* pw toggle */
.hmp-pw-toggle {
  display:flex; align-items:center; justify-content:center; gap:7px;
  font-size:12px; font-weight:600; color:var(--teal); background:none;
  border:1.5px solid var(--teal-border); border-radius:100px; padding:6px 16px;
  cursor:pointer; transition:var(--tr); font-family:var(--font-b); margin:4px auto 14px;
}
.hmp-pw-toggle:hover { background:var(--teal-pale); }

/* save btn */
.hmp-save-wrap { display:flex; justify-content:center; padding-top:12px; }
.hmp-btn {
  display:inline-flex; align-items:center; gap:8px;
  font-size:14px; font-weight:700; padding:12px 40px; border-radius:100px;
  border:none; cursor:pointer; transition:var(--tr); font-family:var(--font-b); letter-spacing:.02em;
}
.hmp-btn-primary {
  background:linear-gradient(135deg,var(--teal) 0%,var(--teal-mid) 100%);
  color:white; box-shadow:0 4px 18px rgba(15,118,110,.28);
}
.hmp-btn-primary:hover { box-shadow:0 8px 28px rgba(15,118,110,.38); transform:translateY(-2px); }
.hmp-btn-primary:active { transform:translateY(0); }
.hmp-btn-secondary {
  background:var(--blue-pale); color:var(--blue);
  border:1.5px solid var(--blue-border); box-shadow:none;
}
.hmp-btn-secondary:hover { background:var(--blue); color:white; transform:translateY(-1px); }
.hmp-btn-warning {
  background:linear-gradient(135deg,#d97706,#b45309);
  color:white; box-shadow:0 4px 18px rgba(180,83,9,.3);
}
.hmp-btn-warning:hover { box-shadow:0 8px 28px rgba(180,83,9,.4); transform:translateY(-2px); }
.hmp-btn:disabled { opacity:.55; cursor:not-allowed; transform:none!important; }

/* otp / messages */
.hmp-otp-hint { font-size:11px; color:var(--ink3); margin-top:5px; font-style:italic; }
.hmp-msg { font-size:13px; color:var(--teal); text-align:center; margin-top:12px; font-weight:500; }

/* doc cards */
.hmp-doc-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); gap:16px; margin-top:20px; }
.hmp-doc-card { background:white; border:1px solid var(--border); border-radius:var(--radius-sm); overflow:hidden; box-shadow:var(--sh-xs); transition:var(--tr); }
.hmp-doc-card:hover { box-shadow:var(--sh-md); border-color:var(--teal-border); }
.hmp-doc-prev {
  height:140px; background:var(--cream2);
  display:flex; align-items:center; justify-content:center;
  overflow:hidden; cursor:pointer; border-bottom:1px solid var(--border);
}
.hmp-doc-prev img { max-height:120px; transition:transform .3s ease; }
.hmp-doc-prev:hover img { transform:scale(1.08); }
.hmp-doc-prev-ico { font-size:44px; opacity:.4; }
.hmp-doc-info { padding:13px 14px; }
.hmp-doc-name { font-size:13px; font-weight:600; color:var(--ink); margin-bottom:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.hmp-doc-meta { font-size:11px; color:var(--ink3); margin-bottom:3px; }
.hmp-doc-status {
  display:inline-flex; align-items:center; gap:5px;
  font-size:10px; font-weight:700; letter-spacing:.06em; text-transform:uppercase;
  padding:3px 10px; border-radius:100px; margin:6px 0 10px;
}
.hmp-doc-status::before { content:''; width:5px; height:5px; border-radius:50%; }
.hmp-doc-approved { background:var(--green-pale); color:var(--green); border:1px solid var(--green-border); }
.hmp-doc-approved::before { background:var(--green); }
.hmp-doc-rejected { background:var(--red-pale); color:var(--red); border:1px solid var(--red-border); }
.hmp-doc-rejected::before { background:var(--red); }
.hmp-doc-pending  { background:var(--yellow-pale); color:var(--yellow); border:1px solid var(--yellow-border); }
.hmp-doc-pending::before  { background:var(--yellow); }
.hmp-doc-btns { display:flex; gap:7px; flex-wrap:wrap; }
.hmp-doc-btn {
  display:inline-flex; align-items:center; gap:5px;
  font-size:11px; font-weight:600; padding:5px 12px; border-radius:100px;
  cursor:pointer; transition:var(--tr); border:1.5px solid transparent; font-family:var(--font-b);
}
.hmp-doc-btn-view   { color:var(--teal);  border-color:var(--teal-border);  background:var(--teal-pale); }
.hmp-doc-btn-view:hover   { background:var(--teal);  color:white; border-color:var(--teal); }
.hmp-doc-btn-cancel { color:var(--red);   border-color:var(--red-border);   background:var(--red-pale); }
.hmp-doc-btn-cancel:hover { background:var(--red);   color:white; border-color:var(--red); }
.hmp-doc-btn-arch   { color:var(--ink3);  border-color:var(--border2);      background:var(--cream2); }
.hmp-doc-btn-arch:hover   { background:var(--ink3);  color:white; border-color:var(--ink3); }

/* file upload zone */
.hmp-upload-zone {
  display:flex; align-items:center; gap:12px; flex-wrap:wrap;
  padding:14px 18px; background:var(--cream2);
  border:1.5px dashed var(--border2); border-radius:var(--radius-sm); transition:var(--tr);
}
.hmp-upload-zone:hover { border-color:var(--teal-mid); background:var(--teal-pale); }

/* section divider label */
.hmp-sec-lbl { display:flex; align-items:center; gap:10px; margin:0 0 20px; }
.hmp-sec-lbl::after { content:''; flex:1; height:1px; background:var(--border); }
.hmp-sec-lbl-txt { font-family:var(--font-d); font-size:15px; font-weight:600; color:var(--ink2); white-space:nowrap; }
.hmp-divider { height:1px; background:var(--border); margin:20px 0; }

/* modal */
.hmp-modal-bg {
  position:fixed; inset:0; background:rgba(28,25,23,.55);
  backdrop-filter:blur(4px); z-index:1050;
  display:flex; align-items:center; justify-content:center; padding:20px;
}
.hmp-modal {
  background:white; border-radius:var(--radius);
  width:100%; max-width:680px;
  box-shadow:0 24px 80px rgba(0,0,0,.2); overflow:hidden;
  animation:hmp-modal-in .2s ease;
  max-height:90vh; display:flex; flex-direction:column;
}
@keyframes hmp-modal-in { from{opacity:0;transform:scale(.96) translateY(8px)} to{opacity:1;transform:none} }
.hmp-modal-head {
  padding:20px 26px 16px; border-bottom:1px solid var(--border); background:var(--cream2);
  display:flex; align-items:center; justify-content:space-between; flex-shrink:0;
}
.hmp-modal-title { font-family:var(--font-d); font-size:18px; font-weight:600; color:var(--ink); }
.hmp-modal-close {
  width:30px; height:30px; border:none; background:none;
  font-size:20px; color:var(--ink3); cursor:pointer;
  border-radius:50%; display:flex; align-items:center; justify-content:center;
  transition:var(--tr); line-height:1;
}
.hmp-modal-close:hover { background:var(--parchment); color:var(--ink); }
.hmp-modal-body { padding:20px 26px; overflow-y:auto; flex:1; text-align:center; }
.hmp-modal-body img { max-width:100%; border-radius:8px; }
.hmp-modal-body iframe { width:100%; height:460px; border:none; border-radius:8px; }
.hmp-modal-foot {
  padding:14px 26px 20px; border-top:1px solid var(--border);
  display:flex; justify-content:flex-end; gap:10px; flex-shrink:0;
}

/* loading/error */
.hmp-state {
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  min-height:60vh; gap:16px; font-size:14px; color:var(--ink3);
  background:var(--cream); font-family:var(--font-b);
}
.hmp-spinner {
  width:44px; height:44px; border:3px solid var(--parchment);
  border-top-color:var(--teal); border-radius:50%;
  animation:hmp-spin .7s linear infinite;
}
@keyframes hmp-spin { to{ transform:rotate(360deg) } }
`;

/* ─────────────────────────── COMPONENT ─────────────────────────── */
export default function HomeMainPage() {
  const { t } = useTranslation();

  const [company, setCompany] = useState("");
  const [speciality, setSpeciality] = useState({ name: "Неизвестно" });
  const [previewDoc, setPreviewDoc] = useState(null);
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhone] = useState("");
  const [clinic, setClinic] = useState("");
  const [about, setAbout] = useState("");
  const [country, setCountry] = useState("");
  const [twitter, setTwitter] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [educationInstitution, setEducationInstitution] = useState("");
  const [educationYears, setEducationYears] = useState("");
  const [specializationInstitution, setSpecializationInstitution] =
    useState("");
  const [specializationYears, setSpecializationYears] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("az");
  const [phoneError, setPhoneError] = useState("");
  const API_BASE = process.env.REACT_APP_API_URL;

  /* ── local UI state ── */
  const [activeTab, setActiveTab] = useState("overview");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setProfileImage(file);
  };

  const navigate = useNavigate();

  const validatePhone = (value, iso) => {
    try {
      const phoneNumber = parsePhoneNumberFromString(value);
      if (!phoneNumber || !phoneNumber.isValid()) {
        setPhoneError("Invalid phone number format.");
        return false;
      }
      setPhoneError("");
      return true;
    } catch (err) {
      setPhoneError("Invalid phone number.");
      return false;
    }
  };

  useEffect(() => {
    if (!doctorProfile) return;
    setCompany(doctorProfile.company || "");
    setAddress(doctorProfile.address || "");
    setPhone(doctorProfile.phoneNumber?.replace(/^\+/, "") || "");
    setClinic(doctorProfile.clinic || "");
    setAbout(doctorProfile.about || "");
    setCountry(doctorProfile.country || "");
    setTwitter(doctorProfile.twitter || "");
    setFacebook(doctorProfile.facebook || "");
    setInstagram(doctorProfile.instagram || "");
    setLinkedin(doctorProfile.linkedin || "");
    setEducationInstitution(doctorProfile.educationInstitution || "");
    setEducationStartYear(doctorProfile.educationStartYear || 1925);
    setEducationEndYear(doctorProfile.educationEndYear || 2025);
    setSpecializationInstitution(doctorProfile.specializationInstitution || "");
    setSpecializationStartYear(doctorProfile.specializationStartYear || 1925);
    setSpecializationEndYear(doctorProfile.specializationEndYear || 2025);
    if (doctorProfile.profileImage) setProfileImage(null);
  }, [doctorProfile]);

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      if (!id) {
        console.error("Error: user is missing from session");
        return;
      }
      try {
        const { data } = await axios.get(
          `${API_BASE}/doctor-profile/get-profile-doctor/${encodeURIComponent(id)}`,
          { withCredentials: true },
        );
        console.log("Profile payload:", data);
        setDoctorProfile(data.profile);
        if (data?.profile?.phoneNumber)
          setPhone(data.profile.phoneNumber.replace(/^\+?/, ""));
      } catch (err) {
        console.error("Error getting doctor profile", err);
        setError("Failed to load doctor profile");
      } finally {
        setLoading(false);
      }
    };
    fetchDoctorProfile();
  }, [id]);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await axios.get(`${API_BASE}/common-for-user`, {
          withCredentials: true,
        });
        if (response.data.authenticated) {
          setIsAuthenticated(true);
          setData(response.data.user);
          console.log(response.data.user);
          setSpeciality(
            response.data.user.specialization
              ? { name: response.data.user.specialization }
              : { name: "Unknown" },
          );
          console.log("✅ Authenticated, user data:", response.data.user);
        } else {
          setIsAuthenticated(false);
          console.log("Not authenticated");
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
      }
    };
    checkAuthentication();
  }, []);

  const [educationStartYear, setEducationStartYear] = useState(1925);
  const [educationEndYear, setEducationEndYear] = useState(2025);
  const [specializationStartYear, setSpecializationStartYear] = useState(1925);
  const [specializationEndYear, setSpecializationEndYear] = useState(2025);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert("Please log in.");
      navigate("/login");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("company", company);
      formData.append("address", address);
      formData.append(
        "phoneNumber",
        phoneNumber.startsWith("+") ? phoneNumber : "+" + phoneNumber,
      );
      formData.append("clinic", clinic);
      formData.append("about", about);
      formData.append("country", country);
      formData.append("twitter", twitter);
      formData.append("facebook", facebook);
      formData.append("instagram", instagram);
      formData.append("linkedin", linkedin);
      formData.append("educationInstitution", educationInstitution);
      formData.append(
        "educationYears",
        `${educationStartYear}-${educationEndYear}`,
      );
      formData.append(
        "specializationYears",
        `${specializationStartYear}-${specializationEndYear}`,
      );
      formData.append("specializationInstitution", specializationInstitution);
      if (profileImage) formData.append("image", profileImage);
      const response = await axios.post(
        `${API_BASE}/doctor-profile/update-profile-of-doctor`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        },
      );
      if (response && response.data) {
        console.log("Data sent successfully:", response.data);
        navigate("/doctor/my-articles");
      } else console.error("Error: Empty response or data not found.");
    } catch (error) {
      console.error("Error sending data: ", error);
    }
  };

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [renewPassword, setRenewPassword] = useState("");
  const [email, setEmail] = useState("");

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== renewPassword) {
      alert("The new password and confirmation do not match.");
      return;
    }
    try {
      const response = await axios.post(
        `${API_BASE}/doctor-profile/change-password-in-profile`,
        { email, currentPassword, newPassword, renewPassword },
        { withCredentials: true },
      );
      alert(response.data.message);
      navigate("/login");
    } catch (error) {
      console.error("Error changing password:", error);
      alert("An error occurred while changing your password.");
    }
  };

  const [isReapetpasswordVisible, setIsReapetpasswordVisible] = useState(false);
  const toggleReapetpasswordVisibility = () =>
    setIsReapetpasswordVisible(!isReapetpasswordVisible);

  const COUNTRY_PHONE_MAP = {
    Afghanistan: "af",
    Albania: "al",
    Algeria: "dz",
    Andorra: "ad",
    Angola: "ao",
    Antigua: "ag",
    "Antigua and Barbuda": "ag",
    Argentina: "ar",
    Armenia: "am",
    Australia: "au",
    Austria: "at",
    Azerbaijan: "az",
    Bahamas: "bs",
    Bahrain: "bh",
    Bangladesh: "bd",
    Barbados: "bb",
    Belarus: "by",
    Belgium: "be",
    Belize: "bz",
    Benin: "bj",
    Bhutan: "bt",
    Bolivia: "bo",
    "Bosnia and Herzegovina": "ba",
    Botswana: "bw",
    Brazil: "br",
    Brunei: "bn",
    Bulgaria: "bg",
    "Burkina Faso": "bf",
    Burundi: "bi",
    Cambodia: "kh",
    Cameroon: "cm",
    Canada: "ca",
    "Cape Verde": "cv",
    "Cabo Verde": "cv",
    "Central African Republic": "cf",
    Chad: "td",
    Chile: "cl",
    China: "cn",
    Colombia: "co",
    Comoros: "km",
    Congo: "cg",
    "Democratic Republic of the Congo": "cd",
    "Costa Rica": "cr",
    Croatia: "hr",
    Cuba: "cu",
    Cyprus: "cy",
    "Czech Republic": "cz",
    Denmark: "dk",
    Djibouti: "dj",
    Dominica: "dm",
    "Dominican Republic": "do",
    Ecuador: "ec",
    Egypt: "eg",
    "El Salvador": "sv",
    "Equatorial Guinea": "gq",
    Eritrea: "er",
    Estonia: "ee",
    Eswatini: "sz",
    Ethiopia: "et",
    Fiji: "fj",
    Finland: "fi",
    France: "fr",
    Gabon: "ga",
    Gambia: "gm",
    Georgia: "ge",
    Germany: "de",
    Ghana: "gh",
    Greece: "gr",
    Grenada: "gd",
    Guatemala: "gt",
    Guinea: "gn",
    "Guinea-Bissau": "gw",
    Guyana: "gy",
    Haiti: "ht",
    Honduras: "hn",
    Hungary: "hu",
    Iceland: "is",
    India: "in",
    Indonesia: "id",
    Iran: "ir",
    Iraq: "iq",
    Ireland: "ie",
    Israel: "il",
    Italy: "it",
    Jamaica: "jm",
    Japan: "jp",
    Jordan: "jo",
    Kazakhstan: "kz",
    Kenya: "ke",
    Kiribati: "ki",
    Kuwait: "kw",
    Kyrgyzstan: "kg",
    Laos: "la",
    Latvia: "lv",
    Lebanon: "lb",
    Lesotho: "ls",
    Liberia: "lr",
    Libya: "ly",
    Liechtenstein: "li",
    Lithuania: "lt",
    Luxembourg: "lu",
    Madagascar: "mg",
    Malawi: "mw",
    Malaysia: "my",
    Maldives: "mv",
    Mali: "ml",
    Malta: "mt",
    "Marshall Islands": "mh",
    Mauritania: "mr",
    Mauritius: "mu",
    Mexico: "mx",
    Micronesia: "fm",
    Moldova: "md",
    Monaco: "mc",
    Mongolia: "mn",
    Montenegro: "me",
    Morocco: "ma",
    Mozambique: "mz",
    Myanmar: "mm",
    Namibia: "na",
    Nauru: "nr",
    Nepal: "np",
    Netherlands: "nl",
    "New Zealand": "nz",
    Nicaragua: "ni",
    Niger: "ne",
    Nigeria: "ng",
    "North Korea": "kp",
    "North Macedonia": "mk",
    Norway: "no",
    Oman: "om",
    Pakistan: "pk",
    Palau: "pw",
    Palestine: "ps",
    Panama: "pa",
    "Papua New Guinea": "pg",
    Paraguay: "py",
    Peru: "pe",
    Philippines: "ph",
    Poland: "pl",
    Portugal: "pt",
    Qatar: "qa",
    Romania: "ro",
    Russia: "ru",
    Rwanda: "rw",
    "Saint Kitts and Nevis": "kn",
    "Saint Lucia": "lc",
    "Saint Vincent and the Grenadines": "vc",
    Samoa: "ws",
    "San Marino": "sm",
    "Sao Tome and Principe": "st",
    "Saudi Arabia": "sa",
    Senegal: "sn",
    Serbia: "rs",
    Seychelles: "sc",
    "Sierra Leone": "sl",
    Singapore: "sg",
    Slovakia: "sk",
    Slovenia: "si",
    "Solomon Islands": "sb",
    Somalia: "so",
    "South Africa": "za",
    "South Korea": "kr",
    "South Sudan": "ss",
    Spain: "es",
    "Sri Lanka": "lk",
    Sudan: "sd",
    Suriname: "sr",
    Sweden: "se",
    Switzerland: "ch",
    Syria: "sy",
    Taiwan: "tw",
    Tajikistan: "tj",
    Tanzania: "tz",
    Thailand: "th",
    "Timor-Leste": "tl",
    Togo: "tg",
    Tonga: "to",
    "Trinidad and Tobago": "tt",
    Tunisia: "tn",
    Turkey: "tr",
    Turkmenistan: "tm",
    Tuvalu: "tv",
    Uganda: "ug",
    Ukraine: "ua",
    "United Arab Emirates": "ae",
    "United Kingdom": "gb",
    "United States": "us",
    Uruguay: "uy",
    Uzbekistan: "uz",
    Vanuatu: "vu",
    Vatican: "va",
    "Vatican City": "va",
    Venezuela: "ve",
    Vietnam: "vn",
    Yemen: "ye",
    Zambia: "zm",
    Zimbabwe: "zw",
  };

  const handleCountrySelect = (e) => {
    const selected = e.target.value;
    setCountry(selected);
    const iso = COUNTRY_PHONE_MAP[selected] || "az";
    setPhoneCountry(iso);
    setPhone("");
    setPhoneError("");
  };

  const countries = [
    "Afghanistan",
    "Albania",
    "Algeria",
    "Andorra",
    "Angola",
    "Antigua and Barbuda",
    "Argentina",
    "Armenia",
    "Australia",
    "Austria",
    "Azerbaijan",
    "Bahamas",
    "Bahrain",
    "Bangladesh",
    "Barbados",
    "Belarus",
    "Belgium",
    "Belize",
    "Benin",
    "Bhutan",
    "Bolivia",
    "Bosnia and Herzegovina",
    "Botswana",
    "Brazil",
    "Brunei",
    "Bulgaria",
    "Burkina Faso",
    "Burundi",
    "Cabo Verde",
    "Cambodia",
    "Cameroon",
    "Canada",
    "Central African Republic",
    "Chad",
    "Chile",
    "China",
    "Colombia",
    "Comoros",
    "Congo (Congo-Brazzaville)",
    "Costa Rica",
    "Croatia",
    "Cuba",
    "Cyprus",
    "Czech Republic",
    "Democratic Republic of the Congo",
    "Denmark",
    "Djibouti",
    "Dominica",
    "Dominican Republic",
    "Ecuador",
    "Egypt",
    "El Salvador",
    "Equatorial Guinea",
    "Eritrea",
    "Estonia",
    "Eswatini",
    "Ethiopia",
    "Fiji",
    "Finland",
    "France",
    "Gabon",
    "Gambia",
    "Georgia",
    "Germany",
    "Ghana",
    "Greece",
    "Grenada",
    "Guatemala",
    "Guinea",
    "Guinea-Bissau",
    "Guyana",
    "Haiti",
    "Honduras",
    "Hungary",
    "Iceland",
    "India",
    "Indonesia",
    "Iran",
    "Iraq",
    "Ireland",
    "Israel",
    "Italy",
    "Ivory Coast",
    "Jamaica",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Kenya",
    "Kiribati",
    "Kuwait",
    "Kyrgyzstan",
    "Laos",
    "Latvia",
    "Lebanon",
    "Lesotho",
    "Liberia",
    "Libya",
    "Liechtenstein",
    "Lithuania",
    "Luxembourg",
    "Madagascar",
    "Malawi",
    "Malaysia",
    "Maldives",
    "Mali",
    "Malta",
    "Marshall Islands",
    "Mauritania",
    "Mauritius",
    "Mexico",
    "Micronesia",
    "Moldova",
    "Monaco",
    "Mongolia",
    "Montenegro",
    "Morocco",
    "Mozambique",
    "Myanmar (Burma)",
    "Namibia",
    "Nauru",
    "Nepal",
    "Netherlands",
    "New Zealand",
    "Nicaragua",
    "Niger",
    "Nigeria",
    "North Korea",
    "North Macedonia",
    "Norway",
    "Oman",
    "Pakistan",
    "Palau",
    "Palestine",
    "Panama",
    "Papua New Guinea",
    "Paraguay",
    "Peru",
    "Philippines",
    "Poland",
    "Portugal",
    "Qatar",
    "Romania",
    "Russia",
    "Rwanda",
    "Saint Kitts and Nevis",
    "Saint Lucia",
    "Saint Vincent and the Grenadines",
    "Samoa",
    "San Marino",
    "Sao Tome and Principe",
    "Saudi Arabia",
    "Senegal",
    "Serbia",
    "Seychelles",
    "Sierra Leone",
    "Singapore",
    "Slovakia",
    "Slovenia",
    "Solomon Islands",
    "Somalia",
    "South Africa",
    "South Korea",
    "South Sudan",
    "Spain",
    "Sri Lanka",
    "Sudan",
    "Suriname",
    "Sweden",
    "Switzerland",
    "Syria",
    "Taiwan",
    "Tajikistan",
    "Tanzania",
    "Thailand",
    "Timor-Leste",
    "Togo",
    "Tonga",
    "Trinidad and Tobago",
    "Tunisia",
    "Turkey",
    "Turkmenistan",
    "Tuvalu",
    "UAE",
    "Uganda",
    "Ukraine",
    "United Kingdom",
    "United States",
    "Uruguay",
    "Uzbekistan",
    "Vanuatu",
    "Vatican City",
    "Venezuela",
    "Vietnam",
    "Yemen",
    "Zambia",
    "Zimbabwe",
  ];

  const AVATAR_OPTIONS = [
    "/assets/img/avatars/boy01.png",
    "/assets/img/avatars/boy03.png",
    "/assets/img/avatars/boy02.png",
    "/assets/img/avatars/businessman.png",
    "/assets/img/avatars/chicken.png",
    "/assets/img/avatars/cool.png",
    "/assets/img/avatars/dog.png",
    "/assets/img/avatars/gamer.png",
    "/assets/img/avatars/girl.png",
    "/assets/img/avatars/girl01.png",
    "/assets/img/avatars/gorilla.png",
    "/assets/img/avatars/lion.png",
    "/assets/img/avatars/man-avatar.png",
    "/assets/img/avatars/man.png",
    "/assets/img/avatars/man01.png",
    "/assets/img/avatars/man02.png",
    "/assets/img/avatars/man03.png",
    "/assets/img/avatars/man04.png",
    "/assets/img/avatars/man05.png",
    "/assets/img/avatars/meerkat.png",
    "/assets/img/avatars/ninja.png",
    "/assets/img/avatars/office-man.png",
    "/assets/img/avatars/profile.png",
    "/assets/img/avatars/profile01.png",
    "/assets/img/avatars/rabbit.png",
    "/assets/img/avatars/rabbit01.png",
    "/assets/img/avatars/student.png",
    "/assets/img/avatars/user.png",
    "/assets/img/avatars/woman.png",
    "/assets/img/avatars/woman01.png",
    "/assets/img/avatars/woman02.png",
    "/assets/img/avatars/woman03.png",
    "/assets/img/avatars/woman04.png",
    "/assets/img/avatars/woman05.png",
    "/assets/img/avatars/woman06.png",
    "/assets/img/avatars/woman07.png",
  ];
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const handleAvatarSelect = (avatar) => setSelectedAvatar(avatar);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const today = new Date();
  const minDate = new Date(
    today.getFullYear() - 100,
    today.getMonth(),
    today.getDate(),
  );
  const maxDate = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate(),
  );

  const handleSubmitMainSettings = async (e) => {
    e.preventDefault();
    const userId = id || data?.userId;
    if (!userId) {
      console.error("Error: user is missing");
      alert(t("profileMain.noUserId"));
      return;
    }
    const requestData = {
      userId,
      avatar: selectedAvatar,
      username: document.getElementById("username").value,
      firstName: document.getElementById("firstName").value,
      lastName: document.getElementById("lastName").value,
      dateOfBirth: document.getElementById("dateOfBirth").value,
      bio: document.getElementById("bio").value,
    };
    try {
      // withCredentials обязателен: сервер теперь определяет профиль по сессии.
      await axios.post(
        `${API_BASE}/doctor-profile/update-main-profile-of-doctor`,
        requestData,
        { withCredentials: true },
      );
      alert(t("profileMain.updated"));
      navigate("/doctor/my-articles");
    } catch (error) {
      console.error(
        "Error sending data:",
        error.response ? error.response.data : error.message,
      );
      if (error.response?.data?.code === "USERNAME_TAKEN") {
        alert(t("profileMain.usernameTaken"));
      } else {
        alert(t("profileMain.updateError"));
      }
    }
  };

  const [specialities, setSpecialities] = useState([]);
  const [selectedSpeciality, setSelectedSpeciality] = useState("");
  useEffect(() => {
    const fetchSpecializations = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/doctor-profile/get-specialization`,
        );
        setSpecialities(response.data);
      } catch (error) {
        console.error("Error loading specializations:", error);
      }
    };
    fetchSpecializations();
  }, []);

  const [verificationFile, setVerificationFile] = useState(null);
  const [verificationType, setVerificationType] = useState("license");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationLoading, setVerificationLoading] = useState(false);

  const handleVerificationUpload = async (e) => {
    e.preventDefault();
    if (!verificationFile) {
      setVerificationMessage("Please select a file.");
      return;
    }
    try {
      setVerificationLoading(true);
      setVerificationMessage("");
      const formData = new FormData();
      formData.append("file", verificationFile);
      formData.append("documentType", verificationType);
      const response = await axios.post(
        `${API_BASE}/doctor-profile/add-verification/documents`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        },
      );
      setVerificationDocuments((prev) => [response.data.document, ...prev]);
      setVerificationFile(null);
    } catch (error) {
      setVerificationMessage(error.response?.data?.message || "Upload error");
    } finally {
      setVerificationLoading(false);
    }
  };

  const [oldEmail, setOldEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [otpEmailCode, setEmailOtpCode] = useState("");
  const [otpEmailSent, setEmailOtpSent] = useState(false);
  const [messageEmail, setEmailMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSendEmailOtp = async () => {
    if (!oldEmail || !newEmail) {
      setEmailMessage("Enter your old and new email.");
      return;
    }
    try {
      const response = await axios.put(
        `${API_BASE}/doctor-profile/update-email-doctor`,
        { oldEmail, newEmail },
        { withCredentials: true },
      );
      if (response.data.otpSent) {
        setEmailOtpSent(true);
        setEmailMessage("Confirmation code sent.");
      }
    } catch (error) {
      setEmailMessage(error.response?.data?.message || "Error sending OTP.");
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (isVerifying) return;
    setIsVerifying(true);
    try {
      const response = await axios.put(
        `${API_BASE}/doctor-profile/update-email-doctor`,
        { oldEmail, newEmail, otpCode: otpEmailCode },
        { withCredentials: true },
      );
      setEmailMessage(response.data.message);
      if (response.data.message === "Email успешно обновлен.")
        setEmailOtpSent(false);
    } catch (error) {
      setEmailMessage(
        error.response?.data?.message || "Ошибка при подтверждении OTP.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const [verificationDocuments, setVerificationDocuments] = useState([]);

  const cancelDocument = async (documentId) => {
    try {
      await axios.delete(
        `${API_BASE}/doctor-profile/cancel-verification-document/${documentId}/cancel`,
        { withCredentials: true },
      );
      setVerificationDocuments((prev) =>
        prev.filter((doc) => doc._id !== documentId),
      );
    } catch (error) {
      alert(error.response?.data?.message || "Cancel error");
    }
  };

  useEffect(() => {
    const fetchVerificationDocuments = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/doctor-profile/get-verification/my-verification-documents`,
          { withCredentials: true },
        );
        setVerificationDocuments(response.data.documents);
      } catch (error) {
        console.error("Error loading verification documents:", error);
      }
    };
    fetchVerificationDocuments();
  }, []);

  /* ── helpers ── */
  const getImgUrl = (p) =>
    p?.startsWith("http") ? p : `${API_BASE}/uploads/${p}`;
  const formatFileSize = (bytes) => {
    if (!bytes) return "—";
    const s = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + " " + s[i];
  };
  const getFileExtension = (fileName) =>
    fileName?.split(".").pop()?.toUpperCase() || "";
  const isImage = (mime) => mime?.startsWith("image/");
  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
  };

  const archiveDocument = async (documentId) => {
    try {
      await axios.put(
        `${API_BASE}/doctor-profile/cancel-verification-document/${documentId}/archive`,
        {},
        { withCredentials: true },
      );
      setVerificationDocuments((prev) =>
        prev.filter((doc) => doc._id !== documentId),
      );
    } catch (error) {
      alert(error.response?.data?.message || "Archive error");
    }
  };

  /* ── ProfileItem (original logic kept) ── */
  const ProfileItem = ({ label, value }) => (
    <div className="hmp-info-item">
      <div className="hmp-info-lbl">{label}</div>
      <div className="hmp-info-val">{value || "—"}</div>
    </div>
  );

  /* ── loading / error ── */
  if (loading)
    return (
      <div className="hmp">
        <style>{styles}</style>
        <div className="hmp-state">
          <div className="hmp-spinner" />
          <span>Загрузка...</span>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="hmp">
        <style>{styles}</style>
        <div className="hmp-state">
          <span style={{ fontSize: 36, opacity: 0.4 }}>⚠</span>
          <span style={{ color: "#dc2626" }}>{error}</span>
        </div>
      </div>
    );

  const nameInitials =
    ((data.firstName?.[0] || "") + (data.lastName?.[0] || "")).toUpperCase() ||
    "Dr";

  const TABS = [
    { key: "overview", icon: "👤", label: t("tabs.overview") },
    { key: "details", icon: "📋", label: t("tabs.details") },
    { key: "edit", icon: "✏️", label: t("tabs.edit") },
    { key: "settings", icon: "⚙️", label: t("tabs.settings") },
    { key: "password", icon: "🔑", label: t("tabs.changePassword") },
    { key: "email", icon: "📧", label: t("tabs.changeEmail") },
    { key: "verification", icon: "🛡️", label: t("verification.tab") },
  ];

  /* ═══════════════════════════ RENDER ═══════════════════════════ */
  return (
    <div className="hmp">
      <style>{styles}</style>

      <OnboardingChecklist />

      {/* ── HERO ── */}
      <div className="hmp-hero">
        <div className="hmp-hero-inner">
          <div className="hmp-hero-photo">
            {doctorProfile?.profileImage ? (
              <img
                src={getImgUrl(doctorProfile.profileImage)}
                alt="Profile"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `${API_BASE}/uploads/default/default-patient-man.png`;
                }}
              />
            ) : (
              <div className="hmp-hero-photo-init">{nameInitials}</div>
            )}
          </div>
          <div className="hmp-hero-info">
            <div className="hmp-hero-tag">DocPats · Doctor Profile</div>
            <div className="hmp-hero-name">
              {t("title")} {data.firstName}&nbsp;{data.lastName}
            </div>
            <div className="hmp-hero-chips">
              {doctorProfile?.company && (
                <span className="hmp-hero-chip">
                  🏥 {doctorProfile.company}
                </span>
              )}
              {doctorProfile?.country && (
                <span className="hmp-hero-chip">
                  🌍 {doctorProfile.country}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="hmp-body">
        {/* ── SIDEBAR ── */}
        <aside className="hmp-sidebar">
          <div className="hmp-side-card">
            <div className="hmp-side-top">
              <img
                className="hmp-side-avatar"
                src={
                  doctorProfile?.profileImage
                    ? getImgUrl(doctorProfile.profileImage)
                    : `${API_BASE}/uploads/default/default-patient-man.png`
                }
                alt="Profile"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `${API_BASE}/uploads/default/default-patient-man.png`;
                }}
              />
              <div className="hmp-side-name">
                {data.firstName} {data.lastName}
              </div>
              {doctorProfile?.company && (
                <div className="hmp-side-co">{doctorProfile.company}</div>
              )}
              {doctorProfile?.country && (
                <div className="hmp-side-badge">🌍 {doctorProfile.country}</div>
              )}
            </div>
            <nav className="hmp-tab-nav">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  className={`hmp-tab-btn${activeTab === tab.key ? " act" : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <span className="hmp-tab-icon">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* ── PANELS ── */}
        <div>
          {/* ── OVERVIEW ── */}
          {activeTab === "overview" && (
            <div className="hmp-card">
              <div className="hmp-cover" />
              <div className="hmp-ov-inner">
                <img
                  className="hmp-ov-avatar"
                  src={
                    doctorProfile?.profileImage
                      ? getImgUrl(doctorProfile.profileImage)
                      : `${API_BASE}/uploads/default/default-patient-man.png`
                  }
                  alt="Profile"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `${API_BASE}/uploads/default/default-patient-man.png`;
                  }}
                />
                <div className="hmp-ov-name">
                  {doctorProfile?.firstName} {doctorProfile?.lastName}
                </div>
                <div className="hmp-ov-co">{doctorProfile?.company || "—"}</div>
                {doctorProfile?.country && (
                  <span className="hmp-ov-country">
                    🌍 {doctorProfile.country}
                  </span>
                )}

                <div className="hmp-info-grid">
                  <ProfileItem
                    label={t("fields.address")}
                    value={doctorProfile?.address}
                  />
                  <ProfileItem
                    label={t("fields.phone")}
                    value={
                      <span dir="ltr">{doctorProfile?.phoneNumber || "—"}</span>
                    }
                  />
                  <ProfileItem
                    label={t("fields.email")}
                    value={doctorProfile?.email}
                  />
                  <ProfileItem
                    label={t("fields.educationInstitution")}
                    value={
                      <>
                        <div>{doctorProfile?.educationInstitution || "—"}</div>
                        {doctorProfile?.educationStartYear &&
                          doctorProfile?.educationEndYear && (
                            <div className="hmp-info-sub">
                              {doctorProfile.educationStartYear} –{" "}
                              {doctorProfile.educationEndYear}
                            </div>
                          )}
                      </>
                    }
                  />
                  <ProfileItem
                    label={t("fields.specializationInstitution")}
                    value={
                      <>
                        <div>
                          {doctorProfile?.specializationInstitution || "—"}
                        </div>
                        {doctorProfile?.specializationStartYear &&
                        doctorProfile?.specializationEndYear ? (
                          <div className="hmp-info-sub">
                            {doctorProfile.specializationStartYear} –{" "}
                            {doctorProfile.specializationEndYear}
                          </div>
                        ) : (
                          <div className="hmp-info-sub">
                            {t("values.unknown")}
                          </div>
                        )}
                      </>
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── DETAILS ── */}
          {activeTab === "details" && (
            <div className="hmp-card">
              <div className="hmp-card-head">
                <div className="hmp-card-head-title">
                  📋 {t("tabs.details")}
                </div>
              </div>
              <div className="hmp-card-body">
                <h5
                  className="hmp-card-head-title"
                  style={{ marginBottom: 16 }}
                >
                  About
                </h5>
                {doctorProfile ? (
                  doctorProfile.about ? (
                    <div className="hmp-about-text">
                      {doctorProfile.about.split("\n").map((p, i) => (
                        <span key={i}>
                          {p}
                          <br />
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: "var(--ink3)", fontStyle: "italic" }}>
                      {t("values.notSpecified")}
                    </p>
                  )
                ) : (
                  <p style={{ color: "var(--ink3)" }}>
                    {t("messages.loading")}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── EDIT ── */}
          {activeTab === "edit" && (
            <div className="hmp-card">
              <div className="hmp-card-head">
                <div className="hmp-card-head-title">✏️ {t("tabs.edit")}</div>
              </div>
              <div className="hmp-card-body">
                <form onSubmit={handleSubmit}>
                  <div className="hmp-row">
                    <label className="hmp-lbl">{t("fields.photo")}</label>
                    <div className="hmp-field">
                      <div className="hmp-photo-row">
                        <img
                          className="hmp-photo-thumb"
                          src={
                            profileImage
                              ? URL.createObjectURL(profileImage)
                              : doctorProfile?.profileImage
                                ? getImgUrl(doctorProfile.profileImage)
                                : `${API_BASE}/assets/img/avatars/boy01.png`
                          }
                          alt="Profile"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `${API_BASE}/uploads/default/default-patient.png`;
                          }}
                        />
                        <button
                          type="button"
                          className="hmp-file-btn"
                          onClick={() =>
                            document.getElementById("profileImage").click()
                          }
                        >
                          📁 {t("buttons.choosePhoto")}
                        </button>
                        <span className="hmp-file-nm">
                          {profileImage
                            ? profileImage.name
                            : t("messages.photoNotSelected")}
                        </span>
                        <input
                          type="file"
                          id="profileImage"
                          accept="image/*"
                          onChange={handleImageChange}
                          style={{ display: "none" }}
                          className="form-control"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="hmp-row">
                    <label className="hmp-lbl">{t("fields.company")}</label>
                    <div className="hmp-field">
                      <input
                        type="text"
                        className="hmp-input"
                        id="company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder={t("fields.company")}
                      />
                    </div>
                  </div>

                  <div className="hmp-row">
                    <label className="hmp-lbl">{t("fields.about")}</label>
                    <div className="hmp-field">
                      <textarea
                        className="hmp-textarea"
                        id="about"
                        value={about}
                        onChange={(e) => setAbout(e.target.value)}
                        placeholder={t("fields.about")}
                      />
                    </div>
                  </div>

                  <div className="hmp-row">
                    <label className="hmp-lbl">{t("fields.country")}</label>
                    <div className="hmp-field">
                      <select
                        className="hmp-select"
                        id="country"
                        name="country"
                        value={country}
                        onChange={handleCountrySelect}
                      >
                        <option value="">{t("values.chooseCountry")}</option>
                        {countries.map((c, i) => (
                          <option key={i} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="hmp-row">
                    <label className="hmp-lbl">{t("fields.address")}</label>
                    <div className="hmp-field">
                      <input
                        type="text"
                        className="hmp-input"
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={t("fields.address")}
                      />
                    </div>
                  </div>

                  <div className="hmp-row">
                    <label className="hmp-lbl">{t("fields.phone")}</label>
                    <div className="hmp-field">
                      <PhoneInput
                        country={phoneCountry}
                        value={phoneNumber}
                        enableAreaCodes={true}
                        countryCodeEditable={false}
                        disableCountryCode={false}
                        onChange={(value, data) => {
                          const full = "+" + value;
                          setPhone(full);
                          validatePhone(full, data.countryCode);
                        }}
                        inputStyle={{
                          width: "100%",
                          border: phoneError
                            ? "1.5px solid #dc2626"
                            : undefined,
                        }}
                      />
                      {phoneError && (
                        <div className="hmp-phone-err">{phoneError}</div>
                      )}
                      {phoneError && (
                        <div className="hmp-phone-err">{phoneError}</div>
                      )}
                    </div>
                  </div>

                  <div className="hmp-row">
                    <label className="hmp-lbl">{t("fields.clinic")}</label>
                    <div className="hmp-field">
                      <input
                        type="text"
                        className="hmp-input"
                        id="clinic"
                        value={clinic}
                        onChange={(e) => setClinic(e.target.value)}
                        placeholder={t("fields.clinic")}
                      />
                    </div>
                  </div>

                  <div className="hmp-row">
                    <label className="hmp-lbl">
                      {t("fields.educationInstitution")}
                    </label>
                    <div className="hmp-field">
                      <input
                        type="text"
                        className="hmp-input"
                        id="higher-education-institution"
                        value={educationInstitution}
                        onChange={(e) =>
                          setEducationInstitution(e.target.value)
                        }
                        placeholder={t("fields.educationInstitution")}
                      />
                    </div>
                  </div>

                  <div className="hmp-row">
                    <label className="hmp-lbl">
                      {t("fields.educationYears")}
                    </label>
                    <div className="hmp-field">
                      <div className="hmp-yr-row">
                        <input
                          style={{ width: 100 }}
                          type="number"
                          className="hmp-input"
                          id="education-start-year"
                          value={educationStartYear}
                          onChange={(e) =>
                            setEducationStartYear(e.target.value)
                          }
                          onBlur={(e) => {
                            let v = parseInt(e.target.value, 10);
                            if (isNaN(v)) v = 1925;
                            v = Math.min(Math.max(v, 1925), educationEndYear);
                            setEducationStartYear(v);
                          }}
                          placeholder="1925"
                          min="1925"
                          max="2025"
                        />
                        <span className="hmp-yr-sep">—</span>
                        <input
                          style={{ width: 100 }}
                          type="number"
                          className="hmp-input"
                          id="education-end-year"
                          value={educationEndYear}
                          onChange={(e) => setEducationEndYear(e.target.value)}
                          onBlur={(e) => {
                            let v = parseInt(e.target.value, 10);
                            if (isNaN(v)) v = 2000;
                            v = Math.min(Math.max(v, educationStartYear), 2025);
                            setEducationEndYear(v);
                          }}
                          placeholder="2025"
                          min="1925"
                          max="2025"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="hmp-row">
                    <label className="hmp-lbl">
                      {t("fields.specializationInstitution")}
                    </label>
                    <div className="hmp-field">
                      <input
                        type="text"
                        className="hmp-input"
                        value={specializationInstitution}
                        onChange={(e) =>
                          setSpecializationInstitution(e.target.value)
                        }
                        placeholder={t("fields.specializationInstitution")}
                      />
                    </div>
                  </div>

                  <div className="hmp-row">
                    <label className="hmp-lbl">
                      {t("fields.specializationYears")}
                    </label>
                    <div className="hmp-field">
                      <div className="hmp-yr-row">
                        <input
                          style={{ width: 100 }}
                          type="number"
                          className="hmp-input"
                          id="specialization-start-year"
                          value={specializationStartYear}
                          onChange={(e) =>
                            setSpecializationStartYear(e.target.value)
                          }
                          onBlur={(e) => {
                            let v = parseInt(e.target.value, 10);
                            if (isNaN(v)) v = 1925;
                            v = Math.min(
                              Math.max(v, 1925),
                              specializationEndYear,
                            );
                            setSpecializationStartYear(v);
                          }}
                          placeholder="1925"
                          min="1925"
                          max="2025"
                        />
                        <span className="hmp-yr-sep">—</span>
                        <input
                          style={{ width: 100 }}
                          type="number"
                          className="hmp-input"
                          id="specialization-end-year"
                          value={specializationEndYear}
                          onChange={(e) =>
                            setSpecializationEndYear(e.target.value)
                          }
                          onBlur={(e) => {
                            let v = parseInt(e.target.value, 10);
                            if (isNaN(v)) v = 2000;
                            v = Math.min(
                              Math.max(v, specializationStartYear),
                              2025,
                            );
                            setSpecializationEndYear(v);
                          }}
                          placeholder="2025"
                          min="1925"
                          max="2025"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="hmp-save-wrap">
                    <button type="submit" className="hmp-btn hmp-btn-primary">
                      💾 {t("buttons.save")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === "settings" && (
            <div className="hmp-card">
              <div className="hmp-card-head">
                <div className="hmp-card-head-title">
                  ⚙️ {t("tabs.settings")}
                </div>
              </div>
              <div className="hmp-card-body">
                <form onSubmit={handleSubmitMainSettings}>
                  <div className="hmp-row">
                    <label className="hmp-lbl">{t("fields.nickname")}</label>
                    <div className="hmp-field">
                      <input
                        type="text"
                        className="hmp-input"
                        id="username"
                        placeholder={t("fields.nickname")}
                      />
                    </div>
                  </div>
                  <div className="hmp-row">
                    <label className="hmp-lbl">{t("fields.firstName")}</label>
                    <div className="hmp-field">
                      <input
                        type="text"
                        className="hmp-input"
                        id="firstName"
                        placeholder={t("fields.firstName")}
                      />
                    </div>
                  </div>
                  <div className="hmp-row">
                    <label className="hmp-lbl">{t("fields.lastName")}</label>
                    <div className="hmp-field">
                      <input
                        type="text"
                        className="hmp-input"
                        id="lastName"
                        placeholder={t("fields.lastName")}
                      />
                    </div>
                  </div>
                  <div className="hmp-row">
                    <label className="hmp-lbl">{t("fields.dateOfBirth")}</label>
                    <div className="hmp-field">
                      <input
                        type="date"
                        id="dateOfBirth"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        min={minDate.toISOString().split("T")[0]}
                        max={maxDate.toISOString().split("T")[0]}
                        className="hmp-input"
                      />
                    </div>
                  </div>
                  <div className="hmp-row">
                    <label className="hmp-lbl">{t("fields.gender")}</label>
                    <div className="hmp-field">
                      <select className="hmp-select" id="bio">
                        <option value="choose">{t("values.choose")}</option>
                        <option value="man">{t("values.man")}</option>
                        <option value="woman">{t("values.woman")}</option>
                      </select>
                    </div>
                  </div>

                  <div className="hmp-divider" />
                  <div className="hmp-sec-lbl">
                    <span className="hmp-sec-lbl-txt">
                      🎨 {t("avatar_choose.chooseAvatar")}
                    </span>
                  </div>
                  <div className="hmp-av-grid">
                    {AVATAR_OPTIONS.map((avatar) => (
                      <img
                        key={avatar}
                        src={avatar}
                        alt="Avatar"
                        className={`hmp-av-opt${selectedAvatar === avatar ? " sel" : ""}`}
                        onClick={() => handleAvatarSelect(avatar)}
                      />
                    ))}
                  </div>

                  <div className="hmp-save-wrap" style={{ marginTop: 24 }}>
                    <button type="submit" className="hmp-btn hmp-btn-primary">
                      💾 {t("buttons.save")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── CHANGE PASSWORD ── */}
          {activeTab === "password" && (
            <div className="hmp-card">
              <div className="hmp-card-head">
                <div className="hmp-card-head-title">
                  🔑 {t("tabs.changePassword")}
                </div>
              </div>
              <div className="hmp-card-body">
                <form onSubmit={handleChangePasswordSubmit}>
                  <div className="hmp-row">
                    <label className="hmp-lbl">{t("fields.email")}</label>
                    <div className="hmp-field">
                      <input
                        type="email"
                        className="hmp-input"
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="hmp-row">
                    <label className="hmp-lbl">
                      {t("fields.currentPassword")}
                    </label>
                    <div className="hmp-field">
                      <input
                        type={isReapetpasswordVisible ? "text" : "password"}
                        className="hmp-input"
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="hmp-row">
                    <label className="hmp-lbl">{t("fields.newPassword")}</label>
                    <div className="hmp-field">
                      <input
                        type={isReapetpasswordVisible ? "text" : "password"}
                        className="hmp-input"
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="hmp-row">
                    <label className="hmp-lbl">
                      {t("fields.repeatNewPassword")}
                    </label>
                    <div className="hmp-field">
                      <input
                        type={isReapetpasswordVisible ? "text" : "password"}
                        className="hmp-input"
                        onChange={(e) => setRenewPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <div
                    className="hmp-save-wrap"
                    style={{ flexDirection: "column", gap: 10 }}
                  >
                    <button
                      type="button"
                      className="hmp-pw-toggle"
                      onClick={toggleReapetpasswordVisibility}
                    >
                      👁{" "}
                      {isReapetpasswordVisible
                        ? t("buttons.hidePassword")
                        : t("buttons.showPassword")}
                    </button>
                    <button type="submit" className="hmp-btn hmp-btn-primary">
                      {t("buttons.changePassword")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── CHANGE EMAIL ── */}
          {activeTab === "email" && (
            <div className="hmp-card">
              <div className="hmp-card-head">
                <div className="hmp-card-head-title">
                  📧 {t("tabs.changeEmail")}
                </div>
              </div>
              <div className="hmp-card-body">
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="hmp-row">
                    <label className="hmp-lbl">{t("fields.oldEmail")}</label>
                    <div className="hmp-field">
                      <input
                        type="email"
                        className="hmp-input"
                        value={oldEmail}
                        onChange={(e) => setOldEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="hmp-row">
                    <label className="hmp-lbl">{t("fields.newEmail")}</label>
                    <div className="hmp-field">
                      <input
                        type="email"
                        className="hmp-input"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  {otpEmailSent && (
                    <div className="hmp-row">
                      <label className="hmp-lbl">{t("fields.otpCode")}</label>
                      <div className="hmp-field">
                        <input
                          type="text"
                          className="hmp-input"
                          value={otpEmailCode}
                          onChange={(e) => setEmailOtpCode(e.target.value)}
                          required
                        />
                        <div className="hmp-otp-hint">
                          Введите код из письма
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="hmp-save-wrap">
                    {!otpEmailSent ? (
                      <button
                        type="button"
                        className="hmp-btn hmp-btn-secondary"
                        onClick={handleSendEmailOtp}
                      >
                        {t("buttons.sendCode")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="hmp-btn hmp-btn-primary"
                        onClick={handleVerifyEmailOtp}
                        disabled={isVerifying}
                      >
                        {t("buttons.confirmEmail")}
                      </button>
                    )}
                  </div>
                  {messageEmail && (
                    <div className="hmp-msg">{messageEmail}</div>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* ── VERIFICATION ── */}
          {activeTab === "verification" && (
            <div>
              <div className="hmp-card">
                <div className="hmp-card-head">
                  <div className="hmp-card-head-title">
                    🛡️ {t("verification.tab")}
                  </div>
                </div>
                <div className="hmp-card-body">
                  <form onSubmit={handleVerificationUpload}>
                    <div className="hmp-row">
                      <label className="hmp-lbl">
                        {t("verification.documentType")}
                      </label>
                      <div className="hmp-field">
                        <select
                          className="hmp-select"
                          value={verificationType}
                          onChange={(e) => setVerificationType(e.target.value)}
                        >
                          <option value="license">
                            {t("documentTypes.license")}
                          </option>
                          <option value="diploma">
                            {t("documentTypes.diploma")}
                          </option>
                          <option value="certificate">
                            {t("documentTypes.certificate")}
                          </option>
                          <option value="passport">
                            {t("documentTypes.passport")}
                          </option>
                          <option value="id_card">
                            {t("documentTypes.id_card")}
                          </option>
                          <option value="other">
                            {t("documentTypes.other")}
                          </option>
                        </select>
                      </div>
                    </div>
                    <div className="hmp-row">
                      <label className="hmp-lbl">
                        {t("verification.uploadFile")}
                      </label>
                      <div className="hmp-field">
                        <input
                          type="file"
                          id="verificationFile"
                          hidden
                          onChange={(e) =>
                            setVerificationFile(e.target.files[0])
                          }
                        />
                        <div className="hmp-upload-zone">
                          <button
                            type="button"
                            className="hmp-file-btn"
                            onClick={() =>
                              document
                                .getElementById("verificationFile")
                                .click()
                            }
                          >
                            📎 {t("buttons.chooseFile")}
                          </button>
                          <span className="hmp-file-nm">
                            {verificationFile
                              ? verificationFile.name
                              : t("messages.noFileSelected")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="hmp-save-wrap">
                      <button
                        type="submit"
                        className="hmp-btn hmp-btn-warning"
                        disabled={verificationLoading}
                      >
                        {verificationLoading
                          ? t("verification.uploading")
                          : `📤 ${t("verification.submit")}`}
                      </button>
                    </div>
                    {verificationMessage && (
                      <div className="hmp-msg">{verificationMessage}</div>
                    )}
                  </form>
                </div>
              </div>

              {verificationDocuments.length > 0 && (
                <div className="hmp-card">
                  <div className="hmp-card-head">
                    <div className="hmp-card-head-title">
                      📂 {t("verification.yourDocuments")}
                    </div>
                  </div>
                  <div className="hmp-card-body">
                    <div className="hmp-doc-grid">
                      {verificationDocuments.map((document) => {
                        const status = document.status?.toLowerCase();
                        const statusClass =
                          status === "approved"
                            ? "hmp-doc-approved"
                            : status === "rejected"
                              ? "hmp-doc-rejected"
                              : "hmp-doc-pending";
                        return (
                          <div key={document._id} className="hmp-doc-card">
                            <div
                              className="hmp-doc-prev"
                              onClick={() => setPreviewDoc(document)}
                            >
                              {isImage(document.fileMime) ? (
                                <img
                                  src={document.fileUrl}
                                  alt={document.fileName}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.transform =
                                      "scale(1.08)")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.transform =
                                      "scale(1)")
                                  }
                                />
                              ) : (
                                <div className="hmp-doc-prev-ico">📄</div>
                              )}
                            </div>
                            <div className="hmp-doc-info">
                              <div
                                className="hmp-doc-name"
                                title={document.fileName}
                              >
                                {document.fileName}
                              </div>
                              <div className="hmp-doc-meta">
                                <b>{t("verification.type")}:</b>{" "}
                                {t(`documentTypes.${document.documentType}`)}
                              </div>
                              <div className="hmp-doc-meta">
                                <b>{t("verification.size")}:</b>{" "}
                                {formatFileSize(document.fileSize)}
                              </div>
                              <div className="hmp-doc-meta">
                                <b>{t("verification.format")}:</b>{" "}
                                {getFileExtension(document.fileName)}
                              </div>
                              <div className="hmp-doc-meta">
                                <b>{t("verification.uploaded")}:</b>{" "}
                                {formatDate(document.createdAt)}
                              </div>
                              <span className={`hmp-doc-status ${statusClass}`}>
                                {t(`statuses.${status}`)}
                              </span>
                              <div className="hmp-doc-btns">
                                <button
                                  className="hmp-doc-btn hmp-doc-btn-view"
                                  onClick={() => setPreviewDoc(document)}
                                >
                                  {t("verification.view")}
                                </button>
                                {status === "pending" && (
                                  <button
                                    className="hmp-doc-btn hmp-doc-btn-cancel"
                                    onClick={() => cancelDocument(document._id)}
                                  >
                                    {t("verification.cancel")}
                                  </button>
                                )}
                                {status === "rejected" && (
                                  <button
                                    className="hmp-doc-btn hmp-doc-btn-arch"
                                    onClick={() =>
                                      archiveDocument(document._id)
                                    }
                                  >
                                    {t("verification.archive")}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {/* end panels */}
      </div>
      {/* end body */}

      {/* ── SIDEBAR PROFILE CARD (original second card) ── */}
      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "0 32px 80px",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div className="hmp-card" style={{ display: "none" }}>
          {/* Original second card kept but hidden — logic preserved */}
          <div
            className="hmp-card-body"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: 32,
            }}
          >
            <img
              style={{ width: 200 }}
              src={doctorProfile?.profileImage}
              alt="Profile"
              className="rounded-circle"
            />
            <h2 style={{ fontFamily: "var(--font-d)", marginTop: 16 }}>
              {data.firstName} {data.lastName}
            </h2>
            <h3 style={{ fontSize: 16, color: "var(--ink3)" }}>
              {doctorProfile?.company}
            </h3>
            <h3 style={{ fontSize: 16, color: "var(--ink3)" }}>
              {doctorProfile?.country}
            </h3>
            <div className="social-links mt-2" />
          </div>
        </div>
      </div>

      {/* ── MODAL ── */}
      {previewDoc && (
        <div
          className="hmp-modal-bg"
          tabIndex="-1"
          onClick={() => setPreviewDoc(null)}
        >
          <div className="hmp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hmp-modal-head">
              <div className="hmp-modal-title">{previewDoc.fileName}</div>
              <button
                type="button"
                className="hmp-modal-close"
                onClick={() => setPreviewDoc(null)}
                aria-label={t("verification.close")}
              >
                ×
              </button>
            </div>
            <div className="hmp-modal-body">
              {isImage(previewDoc.fileMime) ? (
                <img
                  src={previewDoc.fileUrl}
                  alt={previewDoc.fileName}
                  style={{ maxWidth: "100%" }}
                />
              ) : (
                <iframe
                  src={previewDoc.fileUrl}
                  title={t("verification.documentPreview")}
                  style={{ width: "100%", height: "500px" }}
                />
              )}
            </div>
            <div className="hmp-modal-foot">
              <a
                href={previewDoc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hmp-btn hmp-btn-secondary"
                style={{ textDecoration: "none" }}
              >
                🔗 {t("verification.openNewTab")}
              </a>
              <button
                type="button"
                className="hmp-btn hmp-btn-primary"
                style={{ padding: "10px 24px" }}
                onClick={() => setPreviewDoc(null)}
              >
                {t("verification.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
