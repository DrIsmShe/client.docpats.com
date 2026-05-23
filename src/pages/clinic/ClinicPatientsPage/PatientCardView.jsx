// client/src/pages/clinic/ClinicPatientsPage/PatientCardView.jsx
//
// Two-sided printable patient card shown after successful provisional
// registration. Receptionist hands this to the patient.
//
// Front side:
//   - DocPats logo
//   - Patient's full name + DOB
//   - Tmp email + tmp password (large, monospace)
//   - QR code → login page with email prefilled
//   - Clinic name + registration date + expiry date
//
// Back side:
//   - "What you get after activation"
//   - 5 benefit bullets with icons
//   - Activation steps
//   - URL to visit
//
// Email delivery (May 2026):
//   If `patient.email` is set, the backend has already sent a copy of
//   this card to that address (fire-and-forget from createProvisionalUser).
//   We show a green notice on screen confirming this so the receptionist
//   knows the patient has a backup copy. The notice is HIDDEN in print
//   via @media print rules.
//
// Print:
//   - Browser's window.print() with @media print CSS that hides the
//     surrounding app shell and renders ONLY the card on a clean page
//   - Both sides stack vertically when printing, each fits on its own
//     printed page (page-break-after: always between them)
//
// Copy:
//   - Copies "tmpEmail / tempPassword" pair to clipboard so the
//     receptionist can paste into chat/WhatsApp/SMS if the patient asks
//     them to send by message instead of taking a paper card

import React, { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import "./patientCardView.css";

// Deep link the patient lands on when scanning the QR.
// Login page should detect ?provisional=1 and ?email=... and prefill
// the email field. Existing reset-password flow does similar things
// with query params, so this is consistent.
function buildLoginUrl(tmpEmail) {
  const base =
    process.env.REACT_APP_PUBLIC_URL?.replace(/\/$/, "") ||
    "https://docpats.com";
  const params = new URLSearchParams({
    provisional: "1",
    email: tmpEmail,
  });
  return `${base}/login?${params.toString()}`;
}

function formatDate(d, locale) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString(locale || undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return String(d);
  }
}

export default function PatientCardView({
  patient,
  credentials,
  clinic,
  onDone,
}) {
  const { t, i18n } = useTranslation("clinic");
  const cardRef = useRef(null);
  const [copyState, setCopyState] = useState("idle"); // idle | copied | error

  const fullName =
    [patient.firstName, patient.lastName].filter(Boolean).join(" ") || "—";
  const loginUrl = buildLoginUrl(credentials.tmpEmail);
  const todayLabel = formatDate(new Date(), i18n.language);
  const expiresLabel = formatDate(credentials.expiresAt, i18n.language);

  // The contact email the receptionist entered in Step 2 of the wizard.
  // If present, backend has emailed the card to it (fire-and-forget).
  // We show a confirmation notice on screen (hidden in print).
  const emailWasSent = Boolean(patient?.email);

  async function handleCopy() {
    const text =
      `${t("patients.card.copyEmail", {
        defaultValue: "Email",
      })}: ${credentials.tmpEmail}\n` +
      `${t("patients.card.copyPassword", {
        defaultValue: "Пароль",
      })}: ${credentials.tempPassword}\n` +
      `${t("patients.card.copyLogin", {
        defaultValue: "Вход",
      })}: ${loginUrl}`;
    try {
      // Modern clipboard API — works in HTTPS or localhost
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2500);
    } catch {
      // Fallback for older browsers / non-HTTPS environments
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopyState("copied");
        setTimeout(() => setCopyState("idle"), 2500);
      } catch {
        setCopyState("error");
        setTimeout(() => setCopyState("idle"), 2500);
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  function handlePrint() {
    // Browser's native print dialog. The @media print rules in
    // patientCardView.css hide everything except .pcv-printable.
    window.print();
  }

  const benefits = [
    {
      icon: "📋",
      title: t("patients.card.benefits.results.title", {
        defaultValue: "Результаты обследований",
      }),
      text: t("patients.card.benefits.results.text", {
        defaultValue:
          "Анализы, снимки и заключения врачей появятся в личном кабинете автоматически — этой и любой другой клиники DocPats.",
      }),
    },
    {
      icon: "💬",
      title: t("patients.card.benefits.online.title", {
        defaultValue: "Онлайн-консультации",
      }),
      text: t("patients.card.benefits.online.text", {
        defaultValue:
          "Задавайте вопросы врачам в защищённом чате — без записи на приём.",
      }),
    },
    {
      icon: "🧠",
      title: t("patients.card.benefits.ai.title", {
        defaultValue: "AI-помощник",
      }),
      text: t("patients.card.benefits.ai.text", {
        defaultValue:
          "Расшифровка анализов, объяснение диагноза, ответы на вопросы о симптомах.",
      }),
    },
    {
      icon: "📖",
      title: t("patients.card.benefits.history.title", {
        defaultValue: "История в одном месте",
      }),
      text: t("patients.card.benefits.history.text", {
        defaultValue:
          "Все приёмы, рецепты, назначения и заключения врачей — в одной истории болезни.",
      }),
    },
    {
      icon: "📅",
      title: t("patients.card.benefits.scheduling.title", {
        defaultValue: "Запись и напоминания",
      }),
      text: t("patients.card.benefits.scheduling.text", {
        defaultValue:
          "Записывайтесь к врачу через приложение, получайте напоминания за день до приёма.",
      }),
    },
  ];

  return (
    <div className="pcv-wrap">
      {/* Header — NOT printed, only on screen */}
      <div className="pcv-screen-header">
        <h2>
          {t("patients.card.title", {
            defaultValue: "Карточка пациента — выдать на руки",
          })}
        </h2>
        <p>
          {t("patients.card.subtitle", {
            defaultValue:
              "Распечатайте и передайте пациенту. После закрытия этого окна пароль больше нигде не появится в системе — обязательно сохраните карточку.",
          })}
        </p>
      </div>

      {/*
        Email delivery confirmation — shown ONLY on screen (hidden in
        print via @media print). Confirms to receptionist that the
        patient already has a backup copy of the card in their inbox.
      */}
      {emailWasSent && (
        <div className="pcv-email-sent-notice">
          <span className="pcv-email-sent-icon">📧</span>
          <span>
            {t("patients.card.emailSentNotice", {
              email: patient.email,
              defaultValue:
                "Карточка отправлена на {{email}}. Пациент получит копию данных для входа на почту.",
            })}
          </span>
        </div>
      )}

      {/* The actual card — both sides printable */}
      <div ref={cardRef} className="pcv-printable">
        {/* ─── FRONT SIDE ─── */}
        <div className="pcv-card pcv-card-front">
          <div className="pcv-card-header">
            <div className="pcv-brand">
              <div className="pcv-brand-mark">D</div>
              <div className="pcv-brand-name">DocPats</div>
            </div>
            <div className="pcv-card-type">
              {t("patients.card.frontType", {
                defaultValue: "Карта пациента",
              })}
            </div>
          </div>

          <div className="pcv-card-body">
            <div className="pcv-info-block">
              <div className="pcv-field">
                <div className="pcv-field-label">
                  {t("patients.card.fullName", {
                    defaultValue: "Полное имя",
                  })}
                </div>
                <div className="pcv-field-value pcv-name">{fullName}</div>
              </div>

              {patient.dateOfBirth && (
                <div className="pcv-field">
                  <div className="pcv-field-label">
                    {t("patients.fields.dateOfBirth", {
                      defaultValue: "Дата рождения",
                    })}
                  </div>
                  <div className="pcv-field-value">
                    {formatDate(patient.dateOfBirth, i18n.language)}
                  </div>
                </div>
              )}

              <div className="pcv-creds">
                <div className="pcv-field">
                  <div className="pcv-field-label">
                    {t("patients.card.tmpEmail", {
                      defaultValue: "Временный email",
                    })}
                  </div>
                  <div className="pcv-field-value pcv-mono">
                    {credentials.tmpEmail}
                  </div>
                </div>

                <div className="pcv-field">
                  <div className="pcv-field-label">
                    {t("patients.card.tmpPassword", {
                      defaultValue: "Временный пароль",
                    })}
                  </div>
                  <div className="pcv-field-value pcv-mono pcv-password">
                    {credentials.tempPassword}
                  </div>
                </div>
              </div>
            </div>

            <div className="pcv-qr-block">
              <QRCodeSVG
                value={loginUrl}
                size={140}
                level="M"
                includeMargin={false}
              />
              <div className="pcv-qr-hint">
                {t("patients.card.qrHint", {
                  defaultValue: "Отсканируйте, чтобы войти",
                })}
              </div>
            </div>
          </div>

          <div className="pcv-card-footer">
            <div className="pcv-clinic-info">
              <div className="pcv-clinic-name">{clinic?.name || "—"}</div>
              {clinic?.contactPhone && (
                <div className="pcv-clinic-meta">{clinic.contactPhone}</div>
              )}
            </div>
            <div className="pcv-dates">
              <div>
                <span className="pcv-dates-label">
                  {t("patients.card.registered", {
                    defaultValue: "Зарегистрирован",
                  })}
                  :
                </span>{" "}
                {todayLabel}
              </div>
              <div>
                <span className="pcv-dates-label">
                  {t("patients.card.validUntil", {
                    defaultValue: "Активировать до",
                  })}
                  :
                </span>{" "}
                {expiresLabel}
              </div>
            </div>
          </div>
        </div>

        {/* ─── BACK SIDE ─── */}
        <div className="pcv-card pcv-card-back">
          <div className="pcv-card-header pcv-card-header-back">
            <h3>
              {t("patients.card.backTitle", {
                defaultValue: "Что вы получите после активации",
              })}
            </h3>
          </div>

          <div className="pcv-benefits">
            {benefits.map((b, i) => (
              <div key={i} className="pcv-benefit">
                <div className="pcv-benefit-icon">{b.icon}</div>
                <div className="pcv-benefit-text">
                  <div className="pcv-benefit-title">{b.title}</div>
                  <div className="pcv-benefit-desc">{b.text}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="pcv-activate-steps">
            <h4>
              {t("patients.card.howToActivate", {
                defaultValue: "Как активировать",
              })}
            </h4>
            <ol>
              <li>
                {t("patients.card.step1", {
                  defaultValue: "Откройте docpats.com или отсканируйте QR-код",
                })}
              </li>
              <li>
                {t("patients.card.step2", {
                  defaultValue:
                    "Войдите с временным email и паролем с этой карточки",
                })}
              </li>
              <li>
                {t("patients.card.step3", {
                  defaultValue:
                    "Введите свой постоянный email и придумайте пароль",
                })}
              </li>
              <li>
                {t("patients.card.step4", {
                  defaultValue: "Готово — доступ к полной истории открыт",
                })}
              </li>
            </ol>
          </div>

          <div className="pcv-card-footer pcv-card-footer-back">
            <div className="pcv-url">docpats.com</div>
            <div className="pcv-tagline">
              {t("patients.card.tagline", {
                defaultValue: "Здоровье в одном месте",
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Screen-only action bar */}
      <div className="pcv-screen-actions">
        <button
          type="button"
          className="staff-page-btn-secondary"
          onClick={handleCopy}
        >
          {copyState === "copied"
            ? t("patients.card.copied", { defaultValue: "✓ Скопировано" })
            : copyState === "error"
              ? t("patients.card.copyError", {
                  defaultValue: "Не удалось скопировать",
                })
              : t("patients.card.copy", {
                  defaultValue: "📋 Скопировать данные",
                })}
        </button>
        <button
          type="button"
          className="staff-page-btn-secondary"
          onClick={handlePrint}
        >
          {t("patients.card.print", { defaultValue: "🖨️ Распечатать" })}
        </button>
        <button
          type="button"
          className="staff-page-btn-primary"
          onClick={onDone}
        >
          {t("patients.card.done", { defaultValue: "Готово" })}
        </button>
      </div>
    </div>
  );
}
