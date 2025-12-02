// --------- REGISTRATION + LOGIN SYSTEM -------------
document.addEventListener("DOMContentLoaded", () => {
  const loggedIn = localStorage.getItem("loggedIn");
  const savedUser = localStorage.getItem("user");

  if (loggedIn === "true" && savedUser) {
    showApp();
  }

  document.getElementById("registerForm").addEventListener("submit", registerUser);
  document.getElementById("loginForm").addEventListener("submit", loginUser);

  document.getElementById("goToLogin").addEventListener("click", () => {
    document.getElementById("registerScreen").style.display = "none";
    document.getElementById("loginScreen").style.display = "flex";
  });

  document.getElementById("goToRegister").addEventListener("click", () => {
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("registerScreen").style.display = "flex";
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("loggedIn");
    location.reload();
  });
});

function registerUser(e) {
  e.preventDefault();
  const u = document.getElementById("regUser").value.trim();
  const p = document.getElementById("regPass").value.trim();

  if (!u || !p) return alert("Please fill both fields");

  localStorage.setItem("user", JSON.stringify({ username: u, password: p }));
  alert("Registration hogya Ab Login Karo");

  document.getElementById("registerScreen").style.display = "none";
  document.getElementById("loginScreen").style.display = "flex";
}

function loginUser(e) {
  e.preventDefault();
  const u = document.getElementById("loginUser").value.trim();
  const p = document.getElementById("loginPass").value.trim();

  const stored = JSON.parse(localStorage.getItem("user"));
  if (!stored) return alert("Account Nahi Mila. Register first!");

  if (stored.username === u && stored.password === p) {
    localStorage.setItem("loggedIn", "true");
    showApp();
  } else {
    alert("Invalid credentials");
  }
}

function showApp() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("registerScreen").style.display = "none";
  document.getElementById("appShell").style.display = "flex";
}
