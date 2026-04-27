import React from "react";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <div>
      <footer id="footer" className="footer">
        <div className="copyright">
          © {t("copyright")}
          <strong>
            <span> - www.docpats.com</span>
          </strong>
          . {t("all_rights_reserved")}
        </div>

        <div className="credits">
          {t("designed_by")} <a href="https://dr-ismail.com/">DR-DESIGN</a>
        </div>
      </footer>
    </div>
  );
}
