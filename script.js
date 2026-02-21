console.log("🟢 script.js loaded");

// API Configuration
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
   PAGE NAVIGATION - FIXED VERSION
========================= */

// Initialize navigation on page load
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM fully loaded");
  
  // Test backend connection
  await testBackendConnection();
  
  // Setup all navigation elements
  setupNavigation();
  
  // Check URL hash for direct page access
  handleUrlHash();
  
  // Initialize forms based on current page
  const activePage = document.querySelector(".page.active");
  if (activePage) {
    if (activePage.id === "contact") initContactForm();
    if (activePage.id === "sponsor-form") initSponsorForm();
  }
  
  // Update auth button
  updateAuthButton();
  
  // Handle browser back/forward buttons
  window.addEventListener('popstate', function(event) {
    handleUrlHash();
  });
});

// Handle URL hash for direct linking and browser navigation
function handleUrlHash() {
  const hash = window.location.hash.substring(1); // Remove the # symbol
  if (hash) {
    // If hash exists, try to show that page
    showPage(hash, false); // false = don't update hash again
  } else {
    // Default to home page
    showPage('home', false);
  }
}

function setupNavigation() {
  console.log("Setting up navigation");
  
  // Select ALL navigation buttons and links
  const navButtons = document.querySelectorAll("nav button, .footer-section a[data-page], .primary-btn[onclick*='showPage'], .secondary-btn[onclick*='showPage']");
  
  navButtons.forEach(button => {
    // Remove existing listeners to prevent duplicates
    button.removeEventListener('click', navigationHandler);
    // Add new listener
    button.addEventListener('click', navigationHandler);
  });
  
  // Also handle the Login button separately
  const loginBtn = document.querySelector(".login-btn");
  if (loginBtn) {
    loginBtn.removeEventListener('click', loginHandler);
    loginBtn.addEventListener('click', loginHandler);
  }
}

// Separate handler for login button
function loginHandler(e) {
  e.preventDefault();
  window.location.href = 'auth.html';
}

// Navigation handler function
function navigationHandler(e) {
  e.preventDefault();
  
  let pageId = null;
  
  // Get page ID from different possible sources
  if (this.dataset && this.dataset.page) {
    pageId = this.dataset.page;
  } else if (this.getAttribute('onclick')) {
    // Parse onclick attribute for showPage calls
    const onclick = this.getAttribute('onclick');
    const match = onclick.match(/showPage\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (match) {
      pageId = match[1];
    }
  }
  
  console.log("Navigation clicked:", pageId);
  
  if (pageId) {
    showPage(pageId, true); // true = update URL hash
  }
}

function showPage(pageId, updateHash = true) {
  console.log("Showing page:", pageId);
  
  // Hide all pages
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
    page.style.display = 'none';
  });

  // Show selected page
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add("active");
    targetPage.style.display = 'block';
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Update URL hash for browser history (if requested)
    if (updateHash) {
      window.location.hash = pageId;
    }

    // Update active state in navigation
    updateActiveNavState(pageId);

    // Initialize forms if needed
    if (pageId === "contact") {
      setTimeout(initContactForm, 100); // Small delay to ensure DOM is ready
    }
    if (pageId === "sponsor-form") {
      setTimeout(initSponsorForm, 100);
    }
  } else {
    console.error("Page not found:", pageId);
    // If page not found, show home
    if (pageId !== 'home') {
      showPage('home', updateHash);
    }
  }
}

function updateActiveNavState(pageId) {
  // Remove active class from all nav buttons
  document.querySelectorAll("nav button").forEach(btn => {
    btn.classList.remove("active-link");
  });
  
  // Add active class to current page button
  document.querySelectorAll(`nav button[data-page="${pageId}"]`).forEach(btn => {
    btn.classList.add("active-link");
  });
}

/* =========================
   CONTACT FORM
========================= */
function initContactForm() {
  console.log("Initializing contact form");
  const form = document.getElementById("contactForm");
  if (!form) {
    console.log("Contact form not found");
    return;
  }

  // Remove existing listener to prevent duplicates
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);
  
  // Create or get response element
  let response = document.getElementById("formResponse");
  if (!response) {
    response = document.createElement("p");
    response.id = "formResponse";
    response.style.marginTop = "10px";
    response.style.fontWeight = "500";
    newForm.appendChild(response);
  }

  newForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nameInput = newForm.querySelector('#name');
    const emailInput = newForm.querySelector('#email');
    const messageInput = newForm.querySelector('#message');
    
    const name = nameInput?.value.trim();
    const email = emailInput?.value.trim();
    const message = messageInput?.value.trim();

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

/* =========================
   SPONSOR FORM
========================= */
function initSponsorForm() {
  console.log("Initializing sponsor form");
  const form = document.getElementById("sponsorForm");
  if (!form) {
    console.log("Sponsor form not found");
    return;
  }

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

function showFormResponse(element, message, color) {
  if (element) {
    element.textContent = message;
    element.style.color = color;
  }
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
    loginBtn.onclick = (e) => {
      e.preventDefault();
      if (confirm("Logout?")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.reload();
      }
    };
  } else {
    loginBtn.innerHTML = '<i class="fas fa-user"></i> Login';
    loginBtn.onclick = (e) => {
      e.preventDefault();
      window.location.href = "auth.html";
    };
  }
}

// Global functions
window.showPage = showPage;
window.showSponsorForm = () => showPage("sponsor-form");

// Re-initialize on page show (for mobile browsers)
window.addEventListener('pageshow', function(event) {
  handleUrlHash();
  setupNavigation();
  updateAuthButton();
});