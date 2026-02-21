console.log("🟢 script.js loaded");

// API Configuration - Make sure this matches your backend URL
const API_BASE_URL = "http://localhost:5000";

/* =========================
   BACKEND CONNECTION TEST
========================= */
async function testBackendConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/test`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Backend connected:", data);
      return true;
    } else {
      console.error("❌ Backend returned error:", response.status);
      return false;
    }
  } catch (error) {
    console.error("❌ Backend connection failed:", error.message);
    showConnectionError();
    return false;
  }
}

// Show user-friendly connection error
function showConnectionError() {
  // Check if error message already exists
  if (document.getElementById('connection-error')) return;
  
  const errorDiv = document.createElement('div');
  errorDiv.id = 'connection-error';
  errorDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #ff4444;
    color: white;
    text-align: center;
    padding: 12px;
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `;
  errorDiv.innerHTML = `
    <strong>⚠️ Connection Error</strong> 
    Cannot connect to server at ${API_BASE_URL}. 
    <button onclick="window.location.reload()" 
      style="margin-left: 10px; padding: 3px 15px; background: white; 
             color: #ff4444; border: none; border-radius: 4px; cursor: pointer;">
      Refresh
    </button>
    <button onclick="this.parentElement.remove()" 
      style="margin-left: 10px; padding: 3px 10px; background: transparent; 
             color: white; border: 1px solid white; border-radius: 4px; cursor: pointer;">
      Dismiss
    </button>
  `;
  document.body.prepend(errorDiv);
}

/* =========================
   PAGE NAVIGATION
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  // Test backend connection first
  const isConnected = await testBackendConnection();
  
  // If not connected, still allow navigation but show warning
  if (!isConnected) {
    console.warn("⚠️ Running in offline mode - forms will not work");
  }
  
  // Setup navigation
  setupNavigation();
  
  // Initialize forms based on active page
  const activePage = document.querySelector(".page.active");
  if (activePage) {
    if (activePage.id === "contact") initContactForm();
    if (activePage.id === "sponsor-form") initSponsorForm();
  }
  
  // Update auth button
  updateAuthButton();
});

function setupNavigation() {
  const navButtons = document.querySelectorAll("nav button, .footer-section a[data-page]");
  
  navButtons.forEach(button => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const pageId = button.dataset.page;
      if (pageId) {
        showPage(pageId);
      }
    });
  });
}

function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll(".page").forEach(p => {
    p.classList.remove("active");
  });

  // Show selected page
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Update active nav state
    document.querySelectorAll("nav button").forEach(btn => {
      btn.classList.remove("active-link");
      if (btn.dataset.page === pageId) {
        btn.classList.add("active-link");
      }
    });

    // Initialize forms if needed
    if (pageId === "contact") initContactForm();
    if (pageId === "sponsor-form") initSponsorForm();
  }
}

/* =========================
   CONTACT FORM
========================= */
function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  // Remove existing listener to prevent duplicates
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);
  
  const response = document.getElementById("formResponse") || createResponseElement(newForm);

  newForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name")?.value.trim();
    const email = document.getElementById("email")?.value.trim();
    const message = document.getElementById("message")?.value.trim();

    // Validate
    if (!name || !email || !message) {
      showFormResponse(response, "Please fill in all fields", "red");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showFormResponse(response, "Please enter a valid email address", "red");
      return;
    }

    showFormResponse(response, "Sending...", "white");

    try {
      const res = await fetch(`${API_BASE_URL}/api/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to send");
      }

      showFormResponse(response, "✅ Message sent successfully! We'll get back to you soon.", "lightgreen");
      newForm.reset();

    } catch (err) {
      console.error("Contact error:", err);
      showFormResponse(response, "❌ " + (err.message || "Failed to send message. Please try again."), "red");
    }
  });
}

function createResponseElement(form) {
  const response = document.createElement("p");
  response.id = "formResponse";
  response.style.marginTop = "10px";
  response.style.fontWeight = "500";
  form.appendChild(response);
  return response;
}

function showFormResponse(element, message, color) {
  element.textContent = message;
  element.style.color = color;
}

/* =========================
   SPONSOR FORM
========================= */
function initSponsorForm() {
  const form = document.getElementById("sponsorForm");
  if (!form) return;

  // Remove existing listener
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);
  
  // Create or get response element
  let responseMsg = document.getElementById("sponsorResponse");
  if (!responseMsg) {
    responseMsg = document.createElement("p");
    responseMsg.id = "sponsorResponse";
    responseMsg.style.marginTop = "10px";
    responseMsg.style.fontWeight = "500";
    newForm.appendChild(responseMsg);
  }

  newForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
      name: newForm.querySelector('[name="Name"]')?.value,
      email: newForm.querySelector('[name="Email"]')?.value,
      phone: newForm.querySelector('[name="Phone"]')?.value || "",
      supportType: newForm.querySelector('[name="Support Type"]')?.value,
      message: newForm.querySelector('textarea[name="Message"]')?.value
    };

    // Validate required fields
    if (!formData.name || !formData.email || !formData.supportType || !formData.message) {
      showFormResponse(responseMsg, "Please fill in all required fields", "red");
      return;
    }

    showFormResponse(responseMsg, "Submitting...", "white");

    try {
      const res = await fetch(`${API_BASE_URL}/api/sponsors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Submission failed");
      }

      showFormResponse(responseMsg, "✅ Sponsorship request submitted! We'll contact you soon.", "lightgreen");
      newForm.reset();

    } catch (err) {
      console.error("Sponsor error:", err);
      showFormResponse(responseMsg, "❌ " + (err.message || "Submission failed. Please try again."), "red");
    }
  });
}

/* =========================
   AUTH BUTTON UPDATE
========================= */
function updateAuthButton() {
  const loginBtn = document.querySelector(".login-btn");
  if (!loginBtn) return;

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (token && user.name) {
    loginBtn.innerHTML = `<i class="fas fa-user"></i> ${user.name.split(" ")[0]}`;
    loginBtn.onclick = () => {
      if (confirm("Logout?")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.reload();
      }
    };
  } else {
    loginBtn.innerHTML = '<i class="fas fa-user"></i> Login';
    loginBtn.onclick = () => window.location.href = "auth.html";
  }
}

// Global functions
window.showPage = showPage;
window.showSponsorForm = () => showPage("sponsor-form");