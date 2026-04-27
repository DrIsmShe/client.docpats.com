import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Pagenotfound() {
  const { t } = useTranslation();

  return (
    <div>
      <main>
        <div className="container">
          <section className="section error-404 min-vh-100 d-flex flex-column align-items-center justify-content-center">
            <h1>404</h1>

            <h2>{t("errors.pageNotFoundText")}</h2>

            <Link className="btn" to="/">
              {t("errors.backToHome")}
            </Link>

            <img
              src="/assets/img/not-found.svg"
              className="img-fluid py-5"
              alt={t("errors.pageNotFoundAlt")}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
