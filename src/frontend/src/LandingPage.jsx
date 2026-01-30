import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signupUser, loginUser, resetPassword } from "./config/authStore";

const Landing_page = () => {
  const navigate = useNavigate();
  const [view, setView] = useState("login"); // 'login', 'signup', 'forgot'
  
  // Form states
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [signupData, setSignupData] = useState({ 
    username: "", 
    email: "", 
    password: "", 
    confirmPassword: "" 
  });
  const [forgotData, setForgotData] = useState({ 
    email: "", 
    newPassword: "", 
    confirmPassword: "" 
  });
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Login Handler
  const handleLogin = (e) => {
  e.preventDefault();
  setError("");
  setSuccess("");

  if (!loginData.username || !loginData.password) {
    setError("Please fill in all fields");
    return;
  }

  try {
    loginUser({
      identifier: loginData.username,
      password: loginData.password,
    });

    setSuccess("Login successful! Redirecting...");
    setTimeout(() => {
      navigate("/Invoice");
    }, 1000);
  } catch (err) {
    setError(err.message);
  }
};


  // Signup Handler
  const handleSignup = (e) => {
  e.preventDefault();
  setError("");
  setSuccess("");

  if (!signupData.username || !signupData.email || !signupData.password || !signupData.confirmPassword) {
    setError("Please fill in all fields");
    return;
  }

  if (signupData.password !== signupData.confirmPassword) {
    setError("Passwords do not match");
    return;
  }

  if (signupData.password.length < 6) {
    setError("Password must be at least 6 characters long");
    return;
  }

  try {
    signupUser({
      username: signupData.username,
      email: signupData.email,
      password: signupData.password,
    });

    setSuccess("Account created successfully! Please sign in.");
    setTimeout(() => {
      setView("login");
      setSignupData({ username: "", email: "", password: "", confirmPassword: "" });
      setSuccess("");
    }, 2000);
  } catch (err) {
    setError(err.message);
  }
};

  // Forgot Password Handler
  const handleForgotPassword = (e) => {
  e.preventDefault();
  setError("");
  setSuccess("");

  if (!forgotData.email || !forgotData.newPassword || !forgotData.confirmPassword) {
    setError("Please fill in all fields");
    return;
  }

  if (forgotData.newPassword !== forgotData.confirmPassword) {
    setError("Passwords do not match");
    return;
  }

  if (forgotData.newPassword.length < 6) {
    setError("Password must be at least 6 characters long");
    return;
  }

  try {
    resetPassword({
      email: forgotData.email,
      newPassword: forgotData.newPassword,
    });

    setSuccess("Password reset successful! Please sign in.");
    setTimeout(() => {
      setView("login");
      setForgotData({ email: "", newPassword: "", confirmPassword: "" });
      setSuccess("");
    }, 2000);
  } catch (err) {
    setError(err.message);
  }
};


  return (
    <div className="relative min-h-screen w-full bg-[#01040a] text-white font-sans overflow-hidden flex items-center justify-center p-4 md:p-12">
      
      {/* Cinematic Background Lighting - Deeper & Richer */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-700/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-indigo-900/10 rounded-full blur-[180px] pointer-events-none" />

      {/* Floating Sparkles/Particles - High density for "Dusty" look */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div 
            key={i} 
            className="absolute w-0.5 h-0.5 bg-cyan-300 rounded-full opacity-30 animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${2 + Math.random() * 4}s`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="container max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-center z-10">
        
        {/* Left Side: Premium Glass Card */}
        <div className="lg:col-span-7 xl:col-span-7 bg-white/8 border border-white/20 p-10 rounded-4xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-2xl relative overflow-hidden group">
          
          {/* Subtle Top Shine */}
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-cyan-400/20 to-transparent" />
          
          {/* LOGIN VIEW */}
          {view === "login" && (
            <>
              <div className="flex justify-between items-start mb-10">
                <div>
                  <p className="px-auto text-gray-400 text-sm font-medium tracking-wide">Welcome Back to Invoice Manager Your's Personal Billing System</p>
                  <h1 className="text-3xl font-bold tracking-tight mt-2 text-[#006b47]">Sign in</h1>
                </div>
              </div>

              {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-6 bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-xl text-sm">
                  {success}
                </div>
              )}

              <form className="space-y-6" onSubmit={handleLogin}>
                <div className="space-y-2 w-full lg:w-md mx-auto">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Username or email address</label>
                  <input 
                    type="text" 
                    placeholder="Enter your username or email"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    className="w-full bg-white text-gray-900 rounded-xl py-4 px-6 outline-none text-sm font-medium placeholder:text-gray-400 border-none focus:ring-2 focus:ring-cyan-400/50 transition-all shadow-inner"
                  />
                </div>

            <div className="space-y-2 w-full  lg:w-md mx-auto">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Password</label>
              <input 
                type="password" 
                placeholder="Enter your password"
                className="w-full bg-white text-gray-900 rounded-xl py-4 px-6 outline-none text-sm font-medium placeholder:text-gray-400 border-none focus:ring-2 focus:ring-cyan-400/50 transition-all shadow-inner"
              />
              <div className="text-right pt-2">
                <button type="button" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium">Forgot Password?</button>
              </div>
            </div>

            <button className="w-full  lg:w-md mx-auto cursor-pointer bg-[#7febc7] hover:text-cyan-50 text-gray-950 font-black py-4 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all mt-4 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
              onClick={() => navigate('/Invoice')}>
              Sign in 
            </button>
          </form>
          <div className="mt-3">
              <p className="text-gray-500 text-md font-bold uppercase tracking-widest mb-1">No Account?</p>
              <button className="text-cyan-400 text-sm font-bold hover:text-cyan-50  transition-colors hover:cursor-pointer underline-offset-4">Sign up</button>
            </div>
        </div>

        {/* Right Side: Exact Graphic Recreation */}
        <div className="hidden lg:flex lg:col-span-4 xl:col-span-5 items-center justify-center relative min-h-[600px]">
          
          <div className="relative w-full max-w-4xl flex items-center justify-center">
            
            {/* The Main SVG Graphic */}
            <svg viewBox="0 0 600 500" className="w-full h-auto drop-shadow-[0_0_80px_rgba(34,211,238,0.15)]">
              <defs>
                <linearGradient id="handGradientTop" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f472b6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.1" />
                </linearGradient>  
                <radialGradient id="lockGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                </radialGradient>
                
                <filter id="blurFilter">
                   <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
                </filter>
              </defs>
              {/* Top Hand - Palm down, reaching from top right */}
              <g transform="translate(320, 100) rotate(15)">
                {/* Thumb */}
                <path d="M-20,120 Q0,100 30,110" stroke="url(#handGradientTop)" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.5" />
                {/* Fingers */}
                <path d="M10,80 Q60,90 80,140" stroke="url(#handGradientTop)" strokeWidth="12" fill="none" strokeLinecap="round" opacity="0.6" />
                <path d="M40,70 Q90,80 110,130" stroke="url(#handGradientTop)" strokeWidth="12" fill="none" strokeLinecap="round" opacity="0.6" />
                <path d="M70,75 Q110,90 125,135" stroke="url(#handGradientTop)" strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.5" />
                {/* Palm Base */}
                <path d="M100,20 Q80,60 140,140" stroke="url(#handGradientTop)" strokeWidth="20" fill="none" opacity="0.1" />
                
                {/* Digital Nodes on Hand */}
                <circle cx="80" cy="140" r="2" fill="#fff" opacity="0.8" />
                <circle cx="110" cy="130" r="2" fill="#fff" opacity="0.8" />
              </g>
              {/* Central Lock Hologram */}
              <g transform="translate(300, 250)">
                {/* Outer Glow */}
                <circle cx="0" cy="0" r="60" fill="url(#lockGlow)" className="animate-pulse" />
                
                {/* Floating Particles around lock */}
                <g className="animate-[spin_10s_linear_infinite]">
                  <circle cx="50" cy="0" r="2" fill="#22d3ee" />
                  <circle cx="-50" cy="0" r="2" fill="#22d3ee" />
                  <circle cx="0" cy="50" r="2" fill="#22d3ee" />
                  <circle cx="0" cy="-50" r="2" fill="#22d3ee" />
                </g>

                {/* The Padlock */}
                <g transform="scale(1.2)">
                   {/* Shackle */}
                   <path d="M-15,-10 V-20 A15,15 0 0,1 15,-20 V-10" stroke="#22d3ee" strokeWidth="4" fill="none" strokeLinecap="round" />
                   {/* Body */}
                   <rect x="-25" y="-10" width="50" height="40" rx="6" fill="#0c4a6e" stroke="#22d3ee" strokeWidth="2" fillOpacity="0.8" />
                   
                   {/* Keyhole/Tech Details */}
                   <circle cx="0" cy="10" r="6" stroke="#22d3ee" strokeWidth="1.5" fill="none" />
                   <path d="M-2,10 L-3,18 H3 L2,10" fill="#22d3ee" />
                   
                   {/* High-tech scan lines on lock body */}
                   <line x1="-20" y1="0" x2="20" y2="0" stroke="#22d3ee" strokeWidth="0.5" opacity="0.5" />
                   <line x1="-20" y1="20" x2="20" y2="20" stroke="#22d3ee" strokeWidth="0.5" opacity="0.5" />
                </g>
              </g>

              {/* Connecting Lines (Network Effect) */}
              <line x1="260" y1="250" x2="220" y2="240" stroke="#22d3ee" strokeWidth="0.5" opacity="0.3" />
              <line x1="340" y1="250" x2="380" y2="240" stroke="#22d3ee" strokeWidth="0.5" opacity="0.3" />
            </svg>
            
          </div>
        </div>

      </div>

      <style>{`
        input::placeholder {
          font-weight: 500;
          color: #9ca3af; 
        }
      `}</style>
    </div>
  );
};

export default Landing_page;