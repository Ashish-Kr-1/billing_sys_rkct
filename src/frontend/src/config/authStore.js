// src/utils/authStore.js
const STORAGE_KEY = "invoice_users";

/* =========================
   INTERNAL HELPERS
========================= */
const getUsers = () => {
  const users = localStorage.getItem(STORAGE_KEY);
  return users ? JSON.parse(users) : [];
};

const saveUsers = (users) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

/* =========================
   PUBLIC API (FAKE DB)
========================= */

export const signupUser = ({ username, email, password }) => {
  const users = getUsers();

  const exists = users.find(
    (u) => u.username === username || u.email === email
  );
  if (exists) {
    throw new Error("Username or email already exists");
  }

  users.push({
    id: Date.now(),
    username,
    email,
    password,
    createdAt: new Date().toISOString(),
  });

  saveUsers(users);
};

export const loginUser = ({ identifier, password }) => {
  const users = getUsers();

  const user = users.find(
    (u) =>
      (u.username === identifier || u.email === identifier) &&
      u.password === password
  );

  if (!user) {
    throw new Error("Invalid username or password");
  }

  localStorage.setItem("currentUser", JSON.stringify(user));
  return user;
};

export const resetPassword = ({ email, newPassword }) => {
  const users = getUsers();
  const index = users.findIndex((u) => u.email === email);

  if (index === -1) {
    throw new Error("No account found with this email");
  }

  users[index].password = newPassword;
  saveUsers(users);
};

export const logoutUser = () => {
  localStorage.removeItem("currentUser");
};
