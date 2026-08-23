import React from "react";

import { useTranslation } from "react-i18next";
export default function Footer() {
  const { t } = useTranslation("common");
  return (
    <div>
      <footer id="footer" className="footer">
        <div className="copyright">
          {t("footer.copyright")}
          <strong>
            <span> - www.docpats.com</span>
          </strong>
          {t("footer.rights")}
        </div>
        <div className="credits">
          {t("footer.designedBy")} <a href="https://dr-ismail.com/">DR-DESIGN</a>
        </div>
      </footer>
    </div>
  );
}
