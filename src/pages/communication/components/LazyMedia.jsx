import { useRef, useState, useEffect } from "react";

export default function LazyMedia({ src, type, ...props }) {
  const ref = useRef();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  if (!visible) {
    return (
      <div
        ref={ref}
        style={{
          height: 200,
          borderRadius: 10,
          background:
            "linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 37%,#e2e8f0 63%)",
          backgroundSize: "400% 100%",
          animation: "shimmer 1.4s infinite",
        }}
      />
    );
  }

  if (type === "image") {
    return <img ref={ref} src={src} {...props} />;
  }

  if (type === "video") {
    return (
      <video ref={ref} {...props}>
        <source src={src} />
      </video>
    );
  }

  return null;
}
