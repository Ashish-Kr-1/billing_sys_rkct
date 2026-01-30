
const API = import.meta.env.VITE_API_BASE_URL || "https://billing.rkcasting.in/api";
// SIGNUP
export async function signupUser(data) {
  const res = await fetch(`${API}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message);
  return json;
}

// LOGIN
export async function loginUser(data) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message);

  // optional: store user
  localStorage.setItem("user", JSON.stringify(json.user));
  return json;
}

// RESET PASSWORD
export async function resetPassword(data) {
  const res = await fetch(`${API}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message);
  return json;
}
