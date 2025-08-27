// script.js

async function checkSession() {
  const res = await fetch("/api/session");
  const data = await res.json();
  const user = data.user;

  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const adminLink = document.getElementById("adminLink");

  if (user) {
    // Logged in
    loginBtn.style.display = "none";
    registerBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";

    if (user.role === "admin") {
      adminLink.style.display = "inline-block";
    } else {
      adminLink.style.display = "none";
    }
  } else {
    // Not logged in
    loginBtn.style.display = "inline-block";
    registerBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    adminLink.style.display = "none";
  }
}

// ===== AUTH =====
async function login(email, password) {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (res.ok) {
    alert("Login successful");
    checkSession();
  } else {
    alert("Invalid login");
  }
}

async function register(email, password) {
  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (res.ok) {
    alert("Registered successfully");
    checkSession();
  } else {
    alert("User already exists");
  }
}

async function logout() {
  await fetch("/api/logout", { method: "POST" });
  alert("Logged out");
  checkSession();
}

// ===== On Page Load =====
document.addEventListener("DOMContentLoaded", () => {
  checkSession();

  // Hook up buttons
  document.getElementById("logoutBtn").addEventListener("click", logout);
});
