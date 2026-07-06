import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  previewMembershipInvite,
  acceptMembershipInvite,
  getClinicMe,
} from "../../../api/clinic";

export default function MembershipInviteAccept() {
  const { t } = useTranslation("clinic");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [authed, setAuthed] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState(null);
  const [done, setDone] = useState(null);

  const load = useCallback(async () => {
    if (!token) {
      setLoadError(
        t("acceptInvite.noToken", {
          defaultValue: "Ссылка недействительна: отсутствует токен.",
        }),
      );
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);

    const [previewRes, meRes] = await Promise.allSettled([
      previewMembershipInvite(token),
      getClinicMe(),
    ]);

    if (previewRes.status === "fulfilled") {
      setPreview(previewRes.value);
    } else {
      const status = previewRes.reason?.response?.status;
      setLoadError(
        status === 404 || status === 409
          ? t("acceptInvite.invalid", {
              defaultValue:
                "Приглашение недействительно, отозвано или истекло.",
            })
          : t("acceptInvite.loadFailed", {
              defaultValue: "Не удалось загрузить приглашение.",
            }),
      );
    }

    setAuthed(
      meRes.status === "fulfilled" && Boolean(meRes.value?.authenticated),
    );
    setLoading(false);
  }, [token, t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAccept = useCallback(async () => {
    setAccepting(true);
    setAcceptError(null);
    try {
      const res = await acceptMembershipInvite(token);
      setDone({ alreadyMember: Boolean(res?.alreadyMember) });
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      if (status === 403) {
        setAcceptError(
          t("acceptInvite.wrongAccount", {
            defaultValue:
              "Это приглашение выписано на другой email. Войдите под нужным аккаунтом.",
          }),
        );
      } else if (status === 404 || status === 409) {
        setAcceptError(
          t("acceptInvite.invalid", {
            defaultValue: "Приглашение недействительно, отозвано или истекло.",
          }),
        );
      } else {
        setAcceptError(
          data?.error ||
            t("acceptInvite.acceptFailed", {
              defaultValue: "Не удалось принять приглашение.",
            }),
        );
      }
    } finally {
      setAccepting(false);
    }
  }, [token, t]);

  if (loading) {
    return (
      <div className="mia-page">
        <div className="mia-card mia-loading">
          {t("common.loading", { defaultValue: "Загрузка…" })}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mia-page">
        <div className="mia-card">
          <h1 className="mia-title">
            {t("acceptInvite.title", { defaultValue: "Приглашение в клинику" })}
          </h1>
          <div className="mia-error">{loadError}</div>
          <div className="mia-actions">
            <Link to="/" className="mia-btn mia-btn-secondary">
              {t("common.home", { defaultValue: "На главную" })}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mia-page">
        <div className="mia-card">
          <h1 className="mia-title">
            {done.alreadyMember
              ? t("acceptInvite.alreadyMember", {
                  defaultValue: "Вы уже участник этой клиники",
                })
              : t("acceptInvite.success", {
                  defaultValue: "Приглашение принято",
                })}
          </h1>
          <p className="mia-text">
            {t("acceptInvite.successHint", {
              defaultValue: "Теперь у вас есть доступ к клинике.",
            })}
          </p>
          <div className="mia-actions">
            <button
              className="mia-btn mia-btn-primary"
              onClick={() => navigate("/clinic/dashboard")}
              type="button"
            >
              {t("acceptInvite.goToClinic", {
                defaultValue: "Перейти в клинику",
              })}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const clinicName =
    preview?.clinic?.name ||
    t("acceptInvite.aClinic", { defaultValue: "клинику" });
  const roleLabel = t(`roles.${preview?.role}`, {
    defaultValue: preview?.role || "admin",
  });

  return (
    <div className="mia-page">
      <div className="mia-card">
        <h1 className="mia-title">
          {t("acceptInvite.title", { defaultValue: "Приглашение в клинику" })}
        </h1>

        <p className="mia-text">
          {t("acceptInvite.body", {
            defaultValue:
              "Вас приглашают присоединиться к клинике «{{clinic}}» в роли «{{role}}».",
            clinic: clinicName,
            role: roleLabel,
          })}
        </p>

        {preview?.email && (
          <p className="mia-meta">
            {t("acceptInvite.forEmail", {
              defaultValue: "Для аккаунта: {{email}}",
              email: preview.email,
            })}
          </p>
        )}

        {acceptError && <div className="mia-error">{acceptError}</div>}

        {authed ? (
          <div className="mia-actions">
            <button
              className="mia-btn mia-btn-primary"
              onClick={handleAccept}
              disabled={accepting}
              type="button"
            >
              {accepting
                ? t("acceptInvite.accepting", { defaultValue: "Принимаем…" })
                : t("acceptInvite.accept", {
                    defaultValue: "Принять приглашение",
                  })}
            </button>
          </div>
        ) : (
          <>
            <p className="mia-meta">
              {t("acceptInvite.needAuth", {
                defaultValue:
                  "Войдите или зарегистрируйтесь под этим email, чтобы принять приглашение.",
              })}
            </p>
            <div className="mia-actions">
              <Link
                className="mia-btn mia-btn-primary"
                to={`/register?invite=${encodeURIComponent(token)}`}
              >
                {t("acceptInvite.register", {
                  defaultValue: "Зарегистрироваться",
                })}
              </Link>
              <Link
                className="mia-btn mia-btn-secondary"
                to={`/login?invite=${encodeURIComponent(token)}`}
              >
                {t("acceptInvite.login", { defaultValue: "Войти" })}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
