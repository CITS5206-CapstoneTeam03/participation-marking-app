"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppContext } from "../context/app-context";
import { ApiError } from "../interface/apiTypes";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthLoading, isAuthenticated, loginWithCredentials, loginAsRole } = useAppContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) router.replace("/");
  }, [isAuthLoading, isAuthenticated, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setError(null);
    setIsSubmitting(true);

    try {
      // TODO(T-304): this call should remain the primary auth path once backend auth is deployed.
      await loginWithCredentials(email.trim(), password);
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 401
            ? "Invalid email or password."
            : `Server error (${err.status}). Please try again.`,
        );
      } else {
        setError("Unable to connect to the server. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleTestLogin(role: "coordinator" | "tutor") {
    setError(null);
    loginAsRole(role);
    router.push("/");
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <Image src="/uwa-logo.png" alt="UWA logo" width={68} height={68} priority />
          <h1>Participation Marking</h1>
          <p>University of Western Australia</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="login-email" className="login-field-label">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              className="login-field-input"
              placeholder="you@uwa.edu.au"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password" className="login-field-label">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              className="login-field-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              disabled={isSubmitting}
              required
            />
          </div>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login-submit"
            disabled={isSubmitting || !email.trim() || !password}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>

          <div
            className="login-test-divider"
            aria-hidden="true"
            style={{ margin: "14px 0 10px", display: "flex", alignItems: "center", gap: "10px" }}
          >
            <span style={{ height: "1px", flex: 1, background: "#dbe3f1" }} />
            <p
              style={{
                margin: 0,
                color: "#708097",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Test logins
            </p>
            <span style={{ height: "1px", flex: 1, background: "#dbe3f1" }} />
          </div>

          <div className="login-test-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
            <button
              type="button"
              className="login-test-btn"
              onClick={() => handleTestLogin("coordinator")}
              disabled={isSubmitting}
              style={{
                height: "40px",
                borderRadius: "10px",
                border: "1px solid #d8e0ee",
                background: "#f8faff",
                color: "#33445f",
                fontSize: "14px",
                fontWeight: 600,
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              Sign in as Unit Coordinator
            </button>
            <button
              type="button"
              className="login-test-btn"
              onClick={() => handleTestLogin("tutor")}
              disabled={isSubmitting}
              style={{
                height: "40px",
                borderRadius: "10px",
                border: "1px solid #d8e0ee",
                background: "#f8faff",
                color: "#33445f",
                fontSize: "14px",
                fontWeight: 600,
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              Sign in as Tutor
            </button>
          </div>

          <p className="login-test-note" style={{ margin: "10px 0 0", color: "#708097", fontSize: "12px", lineHeight: 1.4 }}>
            Dev-only fallback for frontend testing. TODO(T-304): remove after backend auth rollout.
          </p>
        </form>
      </div>
    </div>
  );
}
