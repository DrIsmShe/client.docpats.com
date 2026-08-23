import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Helmet } from "react-helmet-async";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const hideLanding = [
    "/registration",
    "/login",
    "/confirmationregister",
    "/forgotpassword",
    "/resetpassword",
    "/confirmationresetpassword",
    "/confirmationforgotpassword",
    "/confirmationchangepassword",
    "/changepassword",
  ].includes(location.pathname);

  /* PARALLAX */
  const { scrollY } = useScroll();
  const imageY = useTransform(scrollY, [0, 400], [0, -60]);

  /* ANIMATION VARIANTS */
  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.15 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#f0f6ff,#ffffff)",
      }}
    >
      <Helmet>
        <title>DOCPATS MedConnect – Digital Healthcare Platform</title>
        <meta
          name="description"
          content="DOCPATS MedConnect is a modern digital platform for doctors, patients and clinics to manage medical data, reports and communication."
        />

        {/* OG */}
        <meta property="og:title" content="DOCPATS MedConnect" />
        <meta
          property="og:description"
          content="Digital healthcare ecosystem for doctors, patients and clinics."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://docpats.com/" />
        {/* Файл лежит в public/assets/screens/, а не в public/screens/ —
            по прежнему адресу отдавался не 404, а SPA-шелл со статусом 200
            (catch-all в _redirects), поэтому промах ничем себя не выдавал. */}
        <meta
          property="og:image"
          content="https://docpats.com/assets/screens/doctor-dashboard.png"
        />

        {/* JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "DOCPATS MedConnect",
            applicationCategory: "MedicalApplication",
            operatingSystem: "Web",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
          })}
        </script>
      </Helmet>

      <div className="container py-5">
        <div className="row align-items-center">
          {/* LEFT CONTENT */}
          <motion.div
            className="col-lg-6"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {!hideLanding && (
              <>
                {/* HERO */}

                <motion.div variants={item} className="mb-4">
                  <p style={{ fontSize: "1.2rem", color: "#6c757d" }}>
                    Welcome to
                  </p>
                  <h1
                    className="fw-bold"
                    style={{ fontSize: "3rem", color: "#0d6efd" }}
                  >
                    DOCPATS MedConnect
                  </h1>
                  <p className="text-muted fs-5 mt-2">
                    Secure digital platform for doctors, patients and clinics.
                  </p>
                </motion.div>

                {/* ⛔️ НЕ ТРОГАЕМ */}
                <motion.div variants={item}>
                  <div
                    className="d-flex justify-content-center gap-3"
                    style={{
                      width: "100%",
                      margin: "0 auto",
                      marginBottom: "20px",
                    }}
                  >
                    <button
                      style={{
                        width: "50%",
                        margin: "0 auto",
                        marginBottom: "20px",
                      }}
                      whileHover={{ scale: 1.04 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="btn btn-primary btn-lg px-4"
                      onClick={() => navigate("/patient/home-page")}
                    >
                      I am a Patient
                    </button>
                    <button
                      style={{
                        width: "50%",
                        margin: "0 auto",
                        marginBottom: "20px",
                      }}
                      whileHover={{ scale: 1.04 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="btn btn-success btn-lg px-4"
                      onClick={() => navigate("/doctor/home-page")}
                    >
                      I am a Doctor
                    </button>
                  </div>
                  <div
                    className="d-flex justify-content-center gap-3"
                    style={{
                      width: "100%",
                      margin: "0 auto",
                      marginBottom: "20px",
                    }}
                  >
                    <button
                      style={{
                        width: "50%",
                        margin: "0 auto",
                        marginBottom: "20px",
                      }}
                      whileHover={{ scale: 1.04 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="btn btn-outline-secondary btn-lg"
                      onClick={() => navigate("/demo")}
                    >
                      Try live demo
                    </button>
                    <button
                      style={{
                        width: "50%",
                        margin: "0 auto",
                        marginBottom: "20px",
                      }}
                      className="btn btn-outline-secondary btn-lg"
                      onClick={() => navigate("/pricing")}
                    >
                      View pricing
                    </button>
                  </div>
                </motion.div>

                {/* FEATURES */}
                <motion.div variants={item} className="row g-3 mt-4">
                  {[
                    { title: "Encrypted medical records", icon: "🔒" },
                    { title: "Structured reports", icon: "📊" },
                    { title: "Doctor–patient chat", icon: "💬" },
                    { title: "Clinic-ready system", icon: "🏥" },
                  ].map((f, i) => (
                    <div key={i} className="col-6 col-md-3">
                      <motion.div
                        whileHover={{
                          y: -6,
                          boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                        }}
                        transition={{ type: "spring", stiffness: 220 }}
                        className="card h-100 border-0 rounded-4 p-3 text-center"
                      >
                        <div style={{ fontSize: "1.8rem" }}>{f.icon}</div>
                        <p className="fw-semibold mt-2 mb-0">{f.title}</p>
                      </motion.div>
                    </div>
                  ))}
                </motion.div>

                {/* CLINIC CTA */}
                <motion.div variants={item} className="mt-5">
                  <h5 className="fw-bold">For Clinics & Medical Centers</h5>
                  <p className="text-muted">
                    One platform to manage doctors, patients, analytics and
                    reports.
                  </p>
                  <button
                    className="btn btn-dark btn-lg"
                    onClick={() => navigate("/clinic/home-page")}
                  >
                    Request clinic access
                  </button>
                </motion.div>
              </>
            )}

            <Outlet />

            {!hideLanding && (
              <motion.div variants={item} className="mt-4">
                <p className="text-muted text-center">
                  If you don’t have an account,{" "}
                  <Link to="/registration">register here</Link>.
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* RIGHT IMAGE — PARALLAX */}
          {!hideLanding && (
            <motion.div
              className="col-lg-6 d-none d-lg-flex justify-content-center"
              style={{ y: imageY }}
            >
              <motion.img
                src="/assets/screens/doctor-dashboard.png"
                alt="Doctor dashboard"
                className="img-fluid rounded-4 shadow-lg"
                style={{ maxHeight: "460px" }}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
              />
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}
