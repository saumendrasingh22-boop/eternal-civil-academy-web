"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { ShieldCheck, Lock, LogIn, KeyRound } from "lucide-react";
import { AdminUserAccount } from "@/lib/adminAccessStore";
import { saveAdminAccessToken, clearAdminAccessToken } from "@/lib/adminTokenHelper";

const AUTH_SESSION_KEY = "eca_admin_auth_session_v1";
const OWNER_PWD_KEY = "eca_super_admin_local_pwd_v1";
const DEFAULT_LOCAL_PWD = "ECA@Super2026";

export function getLocalAdminPassword(): string {
  if (typeof window === "undefined") return DEFAULT_LOCAL_PWD;
  return window.localStorage.getItem(OWNER_PWD_KEY) || DEFAULT_LOCAL_PWD;
}

export function setLocalAdminPassword(newPwd: string) {
  if (typeof window === "undefined" || newPwd.trim().length < 6) return;
  window.localStorage.setItem(OWNER_PWD_KEY, newPwd.trim());
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(AUTH_SESSION_KEY);
  clearAdminAccessToken();
}

interface AdminAuthGateProps {
  adminAccounts: AdminUserAccount[];
  onAuthenticated: (account: AdminUserAccount) => void;
  children: React.ReactNode;
  isAuthenticated: boolean;
}

export default function AdminAuthGate({
  adminAccounts,
  onAuthenticated,
  children,
  isAuthenticated,
}: AdminAuthGateProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const hasSupabaseAuth = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    if (typeof window === "undefined" || isAuthenticated) return;
    try {
      const savedId = window.sessionStorage.getItem(AUTH_SESSION_KEY);
      if (savedId) {
        const matched = adminAccounts.find((a) => a.id === savedId && a.isActive);
        if (matched) onAuthenticated(matched);
      }
    } catch {}
  }, [adminAccounts, isAuthenticated, onAuthenticated]);

  if (isAuthenticated) {
    return <>{children}</>;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanEmail = email.trim().toLowerCase();
    const matchedAccount = adminAccounts.find(
      (a) => a.email.toLowerCase() === cleanEmail && a.isActive
    );

    if (!matchedAccount) {
      setError("Access denied. This email is not registered as an active Admin or Super Admin.");
      return;
    }

    setLoading(true);
    try {
      // 1. Live Production Mode: Real Supabase Auth if configured
      if (hasSupabaseAuth) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (authErr) {
          setError(authErr.message || "Invalid email or password.");
          setLoading(false);
          return;
        }
        if (authData?.session?.access_token) saveAdminAccessToken(authData.session.access_token);
        window.sessionStorage.setItem(AUTH_SESSION_KEY, matchedAccount.id);
        onAuthenticated(matchedAccount);
        return;
      }

      // 2. Local / Pre-Supabase Mode: Secure Local Passcode Verification
      const expectedPwd = getLocalAdminPassword();
      if (password !== expectedPwd) {
        setError("Incorrect password. Please check your credentials.");
        setLoading(false);
        return;
      }

      window.sessionStorage.setItem(AUTH_SESSION_KEY, matchedAccount.id);
      onAuthenticated(matchedAccount);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl border-2 border-[#0B1B3D]/15 shadow-xl max-w-md w-full p-7">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#0B1B3D] text-yellow-400 flex items-center justify-center mx-auto shadow">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold text-[#0B1B3D] mt-3">
            Admin & Super Admin Login
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ETERNAL CIVIL ACADEMY • Authorized Personnel Only
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Registered Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@eternalcivilacademy.com"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#0B1B3D]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Admin Password"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#0B1B3D]"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-[#E60000] text-xs font-bold p-3 rounded-xl flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0B1B3D] hover:bg-[#E60000] text-white font-extrabold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition shadow"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? "Verifying..." : "Sign In to Control Panel"}</span>
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-start gap-2">
          <KeyRound className="w-4 h-4 text-[#0B1B3D] shrink-0 mt-0.5" />
          <div>
            {hasSupabaseAuth ? (
              <span>Connected to live Supabase Authentication. Sign in with your Supabase Admin email & password.</span>
            ) : (
              <span>
                Local Mode Active: Use <strong>owner@eternalcivilacademy.com</strong> (or any added admin email) with passcode{" "}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-[#0B1B3D]">
                  ECA@Super2026
                </code>
                . Super Admin can change this passcode inside the panel.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
