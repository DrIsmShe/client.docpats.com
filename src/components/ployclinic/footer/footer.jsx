import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <div>
      <footer id="footer" className="footer">
        <div className="copyright">
          &copy; {t("footer.copyright")}{" "}
          <strong>
            <span>WWW.DOCPATS.COM</span>
          </strong>{" "}
          {t("footer.allRights")}
        </div>

        <div className="credits">
          {t("footer.designedBy")}{" "}
          <Link
            to="https://dr-ismail.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            ISMAYIL ISMAYIL
          </Link>
        </div>
      </footer>
    </div>
  );
}
