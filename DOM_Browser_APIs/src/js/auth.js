// auth.js
// A deliberately simple, front-end-only "authentication" system so the
// Signup / Login / Forgot Password / Reset Password screens from the
// design have something to do. Users are stored in localStorage in
// plain text. THIS IS NOT SECURE and is for learning purposes only —
// a real app must never store or compare passwords like this.

import { loadUsers, saveUsers, setSession, getSession, clearSession } from "./storage.js";

export const isLoggedIn = () => !!getSession();

export const logout = () => {
  clearSession();
  window.location.href = "login.html";
};

export const requireAuth = () => {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
  }
};

export const redirectIfLoggedIn = () => {
  if (isLoggedIn()) {
    window.location.href = "index.html";
  }
};

export function signup(email, password) {
  const users = loadUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: "An account with that email already exists." };
  }
  users.push({ email, password, resetToken: null });
  saveUsers(users);
  setSession(email);
  return { ok: true };
}

export function login(email, password) {
  const users = loadUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) {
    return { ok: false, error: "Email or password is incorrect." };
  }
  setSession(email);
  return { ok: true };
}

export function requestPasswordReset(email) {
  const users = loadUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  // Always resolve "ok" regardless of whether the account exists, so we
  // never reveal which emails are registered.
  if (user) {
    user.resetToken = "demo-token";
    saveUsers(users);
  }
  return { ok: true };
}

export function resetPassword(email, newPassword) {
  const users = loadUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return { ok: false, error: "We couldn't find that account." };
  }
  user.password = newPassword;
  user.resetToken = null;
  saveUsers(users);
  return { ok: true };
}

export function changePassword(currentPassword, newPassword) {
  const session = getSession();
  if (!session) return { ok: false, error: "Not logged in." };
  const users = loadUsers();
  const user = users.find((u) => u.email.toLowerCase() === session.username.toLowerCase());
  if (!user || user.password !== currentPassword) {
    return { ok: false, error: "Current password is incorrect." };
  }
  user.password = newPassword;
  saveUsers(users);
  return { ok: true };
}

export function currentUserEmail() {
  const session = getSession();
  return session ? session.username : null;
}
