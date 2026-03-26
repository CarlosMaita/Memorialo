
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";

  const forceNoindexByEnv = String((import.meta as any).env?.VITE_NOINDEXE ?? (import.meta as any).env?.VITE_NOINDEX ?? "false").toLowerCase() === "true";

  if (forceNoindexByEnv) {
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', 'noindex, nofollow');
  }

  createRoot(document.getElementById("root")!).render(<App />);
  