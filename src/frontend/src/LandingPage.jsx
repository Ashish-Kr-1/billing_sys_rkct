import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─── tiny inline SVG illustration (people + tablet) ──────────
const Illustration = () => (
  <svg viewBox="0 0 420 360" fill="none" className="w-full max-w-[420px]">
    {/* tablet device */}
    <rect x="110" y="40" width="200" height="260" rx="14" fill="#7c3aed" opacity="0.15" />
    <rect x="118" y="48" width="184" height="244" rx="10" fill="#fff" opacity="0.9" />

    {/* avatar circle on tablet */}
    <circle cx="210" cy="120" r="36" fill="#7c3aed" opacity="0.18" />
    <circle cx="210" cy="112" r="18" fill="#7c3aed" opacity="0.35" />
    <ellipse cx="210" cy="148" rx="28" ry="14" fill="#7c3aed" opacity="0.25" />

    {/* check badge */}
    <circle cx="258" cy="88" r="14" fill="#7c3aed" />
    <path d="M252 88 L256 93 L265 83" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

    {/* tablet text lines */}
    <rect x="148" y="170" width="90" height="6" rx="3" fill="#7c3aed" opacity="0.18" />
    <rect x="148" y="184" width="120" height="6" rx="3" fill="#7c3aed" opacity="0.12" />
    <rect x="148" y="198" width="74" height="6" rx="3" fill="#7c3aed" opacity="0.10" />

    {/* cyan accent lines behind tablet */}
    <rect x="90" y="100" width="16" height="4" rx="2" fill="#06b6d4" opacity="0.5" />
    <rect x="82" y="112" width="24" height="4" rx="2" fill="#06b6d4" opacity="0.35" />
    <rect x="94" y="124" width="12" height="4" rx="2" fill="#06b6d4" opacity="0.25" />
    <rect x="314" y="140" width="20" height="4" rx="2" fill="#06b6d4" opacity="0.4" />
    <rect x="320" y="154" width="14" height="4" rx="2" fill="#06b6d4" opacity="0.25" />

    {/* pink dot */}
    <circle cx="96" cy="60" r="5" fill="#ec4899" opacity="0.4" />

    {/* person left (woman) */}
    <circle cx="140" cy="270" r="16" fill="#ec4899" opacity="0.7" />
    <path d="M126 286 Q126 320 140 330 Q154 320 154 286" fill="#ec4899" opacity="0.55" />
    {/* arm reaching */}
    <path d="M150 295 Q175 280 190 290" stroke="#ec4899" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.6" />
    {/* hair */}
    <path d="M128 268 Q130 255 140 254 Q150 255 152 268" fill="#7c3aed" opacity="0.6" />

    {/* person right (man) */}
    <circle cx="250" cy="268" r="14" fill="#06b6d4" opacity="0.7" />
    <path d="M238 282 Q238 312 250 320 Q262 312 262 282" fill="#06b6d4" opacity="0.5" />

    {/* ground shadow */}
    <ellipse cx="210" cy="335" rx="100" ry="8" fill="#1e1b4b" opacity="0.12" />
  </svg>
);

// ─── Eye icon for password toggle ─────────────────────────────
const EyeIcon = ({ open }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </>
    )}
  </svg>
);

export default function App() {
  const navigate = useNavigate();

  // ── view state ──
  const [view, setView] = useState("login"); // login | signup | forgot

  // ── form data ──
  const [login,  setLogin]  = useState({ email: "", password: "" });
  const [signup, setSignup] = useState({ name: "", email: "", mobile_no: "", password: "" });
  const [forgot, setForgot] = useState({ email: "", newPassword: "", confirmPassword: "" });

  // ── password visibility toggles ──
  const [showLoginPw,   setShowLoginPw]   = useState(false);
  const [showSignupPw,  setShowSignupPw]  = useState(false);
  const [showForgotPw1, setShowForgotPw1] = useState(false);
  const [showForgotPw2, setShowForgotPw2] = useState(false);

  // ── status ──
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // ── on mount: if a valid token already exists, skip straight to /Invoice ──
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${API}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(d => { if (d.success) navigate("/Invoice"); })
        .catch(() => {});
    }
  }, []);

  // ── helpers ──
  const clear      = () => { setError(""); setSuccess(""); };
  const switchView = (v) => { setView(v); clear(); };

  // ─── LOGIN ────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    clear();
    if (!login.email || !login.password) return setError("Email and password are required");
    setLoading(true);

    try {
      const res  = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: login.email, password: login.password })
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user",  JSON.stringify(data.user));
        setSuccess("Login successful — redirecting…");
        setTimeout(() => navigate("/Invoice"), 1200);
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error. Check your connection.");
    }
    setLoading(false);
  };

  // ─── SIGNUP ───────────────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault();
    clear();
    if (!signup.name || !signup.email || !signup.password)
      return setError("Name, email and password are required");
    if (signup.password.length < 6)
      return setError("Password must be at least 6 characters");
    setLoading(true);

    try {
      const res  = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signup)
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess("Account created! You can sign in now.");
        setSignup({ name: "", email: "", mobile_no: "", password: "" });
        setTimeout(() => switchView("login"), 2000);
      } else {
        setError(data.error || "Signup failed");
      }
    } catch {
      setError("Network error. Check your connection.");
    }
    setLoading(false);
  };

  // ─── FORGOT PASSWORD ──────────────────────────────────────
  const handleForgot = async (e) => {
    e.preventDefault();
    clear();
    if (!forgot.email || !forgot.newPassword || !forgot.confirmPassword)
      return setError("All fields are required");
    if (forgot.newPassword !== forgot.confirmPassword)
      return setError("Passwords do not match");
    if (forgot.newPassword.length < 6)
      return setError("Password must be at least 6 characters");
    setLoading(true);

    try {
      const res  = await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgot.email, newPassword: forgot.newPassword })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess("Password reset successfully!");
        setForgot({ email: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => switchView("login"), 2000);
      } else {
        setError(data.error || "Reset failed");
      }
    } catch {
      setError("Network error. Check your connection.");
    }
    setLoading(false);
  };

  // ─── shared input style ───────────────────────────────────
  const inputCls = `
    w-full border border-gray-200 rounded-lg py-3.5 px-4 text-sm text-gray-700
    bg-gray-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100
    outline-none transition-all placeholder:text-gray-400
    disabled:opacity-45 disabled:cursor-not-allowed
  `;

  // password input with eye toggle
  const PasswordInput = ({ value, onChange, placeholder, show, onToggle }) => (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={loading}
        className={inputCls}
      />
      <button type="button" onClick={onToggle}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition-colors">
        <EyeIcon open={show} />
      </button>
    </div>
  );

  // ─── heading that changes per view ────────────────────────
  const headingText =
    view === "login"  ? "SIGN IN"        :
    view === "signup" ? "SIGN UP"        :
                        "RESET PASSWORD";

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ════════════ LEFT PANEL — deep navy ════════════════════ */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #1e1b4b 0%, #1e3a5f 60%, #1e1b4b 100%)" }}>

        {/* subtle diagonal white stripe */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-full h-full" style={{
            background: "linear-gradient(135deg, transparent 55%, rgba(255,255,255,0.035) 55%)"
          }} />
        </div>

        {/* geometric accent shapes */}
        <div className="absolute bottom-0 left-0 w-48 h-48 border-l-2 border-b-2 border-white opacity-5 rounded-br-full" />
        <div className="absolute top-16 left-10 w-24 h-24 border border-white opacity-5 rounded-full" />

        {/* illustration centred */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-10 py-16">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-72 h-72 rounded-full bg-white opacity-[0.06]" />
            <div className="relative z-10">
              <Illustration />
            </div>
          </div>
        </div>

        {/* footer text */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-white opacity-25 text-xs tracking-widest uppercase">Invoice Manager © 2025</p>
        </div>
      </div>

      {/* ════════════ RIGHT PANEL — white card ══════════════════ */}
      <div className="w-full lg:w-7/12 flex items-center justify-center bg-gray-100 px-6 py-12">

        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* ── purple heading badge ── */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="flex items-end justify-center rounded-t-full"
                style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", width: "176px", height: "88px" }}>
                <span className="text-white text-sm font-black tracking-widest pb-3 drop-shadow">
                  {headingText}
                </span>
              </div>
              {/* small circle knob */}
              <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full"
                style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }} />
            </div>
          </div>

          {/* ── form body ── */}
          <div className="px-8 pt-7 pb-8">

            {/* alerts */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2.5 flex items-start gap-2">
                <span className="mt-0.5">⚠</span><span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg px-3 py-2.5 flex items-start gap-2">
                <span className="mt-0.5">✓</span><span>{success}</span>
              </div>
            )}

            {/* ─── LOGIN FORM ─── */}
            {view === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-gray-500 text-sm mb-1.5">Email</label>
                  <input type="email" placeholder="you@example.com"
                    value={login.email} onChange={e => setLogin({ ...login, email: e.target.value })}
                    disabled={loading} className={inputCls} />
                </div>
                <div>
                  <label className="block text-gray-500 text-sm mb-1.5">Password</label>
                  <PasswordInput value={login.password}
                    onChange={e => setLogin({ ...login, password: e.target.value })}
                    placeholder="••••••••" show={showLoginPw}
                    onToggle={() => setShowLoginPw(!showLoginPw)} />
                </div>

                <div className="text-right -mt-2">
                  <button type="button" onClick={() => switchView("forgot")}
                    className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors">
                    Forgot password?
                  </button>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full text-white font-black text-sm tracking-widest uppercase py-3.5 rounded-lg shadow-md transition-all disabled:opacity-45 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg,#1e3a5f,#1e1b4b)" }}>
                  {loading ? "Signing in…" : "Sign In"}
                </button>

                <p className="text-center text-gray-400 text-xs pt-1">
                  Don't have an account?{" "}
                  <button type="button" onClick={() => switchView("signup")}
                    className="text-indigo-500 font-semibold hover:text-indigo-700 transition-colors">
                    Sign Up
                  </button>
                </p>
              </form>
            )}

            {/* ─── SIGNUP FORM ─── */}
            {view === "signup" && (
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-gray-500 text-sm mb-1.5">Name</label>
                  <input type="text" placeholder="John Doe"
                    value={signup.name} onChange={e => setSignup({ ...signup, name: e.target.value })}
                    disabled={loading} className={inputCls} />
                </div>
                <div>
                  <label className="block text-gray-500 text-sm mb-1.5">Email</label>
                  <input type="email" placeholder="you@example.com"
                    value={signup.email} onChange={e => setSignup({ ...signup, email: e.target.value })}
                    disabled={loading} className={inputCls} />
                </div>
                <div>
                  <label className="block text-gray-500 text-sm mb-1.5">Mobile</label>
                  <div className="relative">
                    <input type="tel" placeholder="9876543210"
                      value={signup.mobile_no} onChange={e => setSignup({ ...signup, mobile_no: e.target.value })}
                      disabled={loading} className={inputCls} />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-xs">📱</span>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-500 text-sm mb-1.5">Password</label>
                  <PasswordInput value={signup.password}
                    onChange={e => setSignup({ ...signup, password: e.target.value })}
                    placeholder="Min 6 characters" show={showSignupPw}
                    onToggle={() => setShowSignupPw(!showSignupPw)} />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full text-white font-black text-sm tracking-widest uppercase py-3.5 rounded-lg shadow-md transition-all disabled:opacity-45 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg,#1e3a5f,#1e1b4b)" }}>
                  {loading ? "Creating…" : "Register"}
                </button>

                <p className="text-center text-gray-400 text-xs pt-1">
                  Already have an account?{" "}
                  <button type="button" onClick={() => switchView("login")}
                    className="text-indigo-500 font-semibold hover:text-indigo-700 transition-colors">
                    Sign In
                  </button>
                </p>
              </form>
            )}

            {/* ─── FORGOT PASSWORD FORM ─── */}
            {view === "forgot" && (
              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <label className="block text-gray-500 text-sm mb-1.5">Registered Email</label>
                  <input type="email" placeholder="you@example.com"
                    value={forgot.email} onChange={e => setForgot({ ...forgot, email: e.target.value })}
                    disabled={loading} className={inputCls} />
                </div>
                <div>
                  <label className="block text-gray-500 text-sm mb-1.5">New Password</label>
                  <PasswordInput value={forgot.newPassword}
                    onChange={e => setForgot({ ...forgot, newPassword: e.target.value })}
                    placeholder="Min 6 characters" show={showForgotPw1}
                    onToggle={() => setShowForgotPw1(!showForgotPw1)} />
                </div>
                <div>
                  <label className="block text-gray-500 text-sm mb-1.5">Confirm New Password</label>
                  <PasswordInput value={forgot.confirmPassword}
                    onChange={e => setForgot({ ...forgot, confirmPassword: e.target.value })}
                    placeholder="Re-enter password" show={showForgotPw2}
                    onToggle={() => setShowForgotPw2(!showForgotPw2)} />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full text-white font-black text-sm tracking-widest uppercase py-3.5 rounded-lg shadow-md transition-all disabled:opacity-45 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg,#1e3a5f,#1e1b4b)" }}>
                  {loading ? "Resetting…" : "Reset Password"}
                </button>

                <p className="text-center text-gray-400 text-xs pt-1">
                  Remember your password?{" "}
                  <button type="button" onClick={() => switchView("login")}
                    className="text-indigo-500 font-semibold hover:text-indigo-700 transition-colors">
                    Sign In
                  </button>
                </p>
              </form>
            )}
          </div>

          {/* bottom teal accent bar */}
          <div className="h-3" style={{ background: "linear-gradient(90deg,#99f6e4,#5eead4,#99f6e4)" }} />
        </div>
      </div>
    </div>
  );
}