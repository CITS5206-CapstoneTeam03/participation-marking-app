"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppContext } from "../context/app-context";
import { ApiError } from "../interface/apiTypes";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthLoading, isAuthenticated, loginWithCredentials } = useAppContext();

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
        </form>
      </div>
    </div>
  );
}
