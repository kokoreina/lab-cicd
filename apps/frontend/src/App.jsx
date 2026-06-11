import { useEffect, useState } from "react";

export default function App() {
  const [message, setMessage] = useState("Dang tai message tu backend...");
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    fetch("/api/message")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setMessage(data.message);
        setStatus("ready");
      })
      .catch((error) => {
        setMessage(`Khong goi duoc backend: ${error.message}`);
        setStatus("error");
      });
  }, []);

  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">ArgoCD + Minikube + Local Images</p>
        <h1>GitOps Fullstack Demo</h1>
        <div className={`message ${status}`}>
          <span>Backend message</span>
          <strong>{message}</strong>
        </div>
      </section>
    </main>
  );
}
