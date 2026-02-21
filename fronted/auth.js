const API_BASE_URL = "http://localhost:5000";

// Handle Login Form
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const msg = document.getElementById("loginMsg");

      msg.textContent = "Logging in...";
      msg.style.color = "#555";

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Login failed");
        }

        msg.textContent = data.message;
        msg.style.color = "green";

        // Store token and user data
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Redirect to home
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1000);

      } catch (err) {
        msg.textContent = err.message;
        msg.style.color = "red";
      }
    });
  }

  // Check if user is already logged in
  const token = localStorage.getItem("token");
  if (token && window.location.pathname.includes("auth.html")) {
    window.location.href = "index.html";
  }
});