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
   PAGE NAVIGATION - IMPROVED VERSION
========================= */

// Track navigation history
let navigationHistory = ['home'];
let currentPageIndex = 0;

// Initialize navigation on page load
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM fully loaded");
  
  // Test backend connection
  await testBackendConnection();
  
  // Setup all navigation elements
  setupNavigation();
  
  // Add back to home button to all pages
  addBackToHomeButton();
  
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
    if (event.state && event.state.page) {
      showPage(event.state.page, false);
    } else {
      handleUrlHash();
    }
  });
});

// Handle URL hash for direct linking and browser navigation
function handleUrlHash() {
  const hash = window.location.hash.substring(1); // Remove the # symbol
  if (hash) {
    showPage(hash, false);
  } else {
    showPage('home', false);
  }
}

function setupNavigation() {
  console.log("Setting up navigation");
  
  // Select ALL navigation buttons and links
  const navButtons = document.querySelectorAll("nav button, .footer-section a[data-page], .primary-btn[onclick*='showPage'], .secondary-btn[onclick*='showPage']");
  
  navButtons.forEach(button => {
    button.removeEventListener('click', navigationHandler);
    button.addEventListener('click', navigationHandler);
  });
  
  // Handle login button
  const loginBtn = document.querySelector(".login-btn");
  if (loginBtn) {
    loginBtn.removeEventListener('click', loginHandler);
    loginBtn.addEventListener('click', loginHandler);
  }
  
  // Add home button to header if it doesn't exist
  addHomeButtonToHeader();
}

// Add a home button to the header for easy navigation
function addHomeButtonToHeader() {
  const headerActions = document.querySelector('.header-actions');
  if (!headerActions) return;
  
  // Check if home button already exists
  if (document.querySelector('.home-nav-btn')) return;
  
  const homeBtn = document.createElement('button');
  homeBtn.className = 'home-nav-btn';
  homeBtn.innerHTML = '<i class="fas fa-home"></i> Home';
  homeBtn.style.marginRight = '10px';
  homeBtn.style.backgroundColor = 'transparent';
  homeBtn.style.border = '1px solid #ff8c00';
  homeBtn.style.color = '#ff8c00';
  homeBtn.style.padding = '8px 15px';
  homeBtn.style.borderRadius = '5px';
  homeBtn.style.cursor = 'pointer';
  homeBtn.style.fontWeight = '500';
  
  homeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('home', true);
  });
  
  homeBtn.addEventListener('mouseover', () => {
    homeBtn.style.backgroundColor = '#ff8c00';
    homeBtn.style.color = '#fff';
  });
  
  homeBtn.addEventListener('mouseout', () => {
    homeBtn.style.backgroundColor = 'transparent';
    homeBtn.style.color = '#ff8c00';
  });
  
  headerActions.prepend(homeBtn);
}

// Add "Back to Home" button to each page
function addBackToHomeButton() {
  const pages = document.querySelectorAll('.page');
  
  pages.forEach(page => {
    // Skip if button already exists
    if (page.querySelector('.back-to-home')) return;
    
    // Don't add to home page
    if (page.id === 'home') return;
    
    const backButton = document.createElement('div');
    backButton.className = 'back-to-home';
    backButton.style.margin = '20px 0';
    backButton.style.textAlign = 'center';
    
    backButton.innerHTML = `
      <button onclick="showPage('home', true)" 
        style="background: transparent; border: 2px solid #ff8c00; color: #ff8c00; 
               padding: 10px 25px; border-radius: 25px; font-size: 16px; 
               font-weight: 600; cursor: pointer; display: inline-flex; 
               align-items: center; gap: 8px; transition: all 0.3s ease;"
        onmouseover="this.style.background='#ff8c00'; this.style.color='#fff';"
        onmouseout="this.style.background='transparent'; this.style.color='#ff8c00';">
        <i class="fas fa-arrow-left"></i> Back to Home
      </button>
    `;
    
    page.appendChild(backButton);
  });
}

// Login handler
function loginHandler(e) {
  e.preventDefault();
  window.location.href = 'auth.html';
}

// Navigation handler function
function navigationHandler(e) {
  e.preventDefault();
  
  let pageId = null;
  
  if (this.dataset && this.dataset.page) {
    pageId = this.dataset.page;
  } else if (this.getAttribute('onclick')) {
    const onclick = this.getAttribute('onclick');
    const match = onclick.match(/showPage\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (match) {
      pageId = match[1];
    }
  }
  
  console.log("Navigation clicked:", pageId);
  
  if (pageId) {
    showPage(pageId, true);
  }
}

function showPage(pageId, updateHash = true) {
  console.log("Showing page:", pageId);
  
  // Update navigation history
  if (navigationHistory[navigationHistory.length - 1] !== pageId) {
    navigationHistory.push(pageId);
    currentPageIndex = navigationHistory.length - 1;
  }
  
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

    // Update URL hash for browser history
    if (updateHash) {
      window.location.hash = pageId;
      // Add to browser history
      history.pushState({ page: pageId }, '', `#${pageId}`);
    }

    // Update active state in navigation
    updateActiveNavState(pageId);

    // Initialize forms if needed
    if (pageId === "contact") {
      setTimeout(initContactForm, 100);
    }
    if (pageId === "sponsor-form") {
      setTimeout(initSponsorForm, 100);
    }
    
    // Show/hide back to home button based on page
    updateBackButtonVisibility(pageId);
    
  } else {
    console.error("Page not found:", pageId);
    if (pageId !== 'home') {
      showPage('home', updateHash);
    }
  }
}

// Update back button visibility
function updateBackButtonVisibility(currentPage) {
  const backButtons = document.querySelectorAll('.back-to-home');
  backButtons.forEach(btn => {
    if (currentPage === 'home') {
      btn.style.display = 'none';
    } else {
      btn.style.display = 'block';
    }
  });
}

function updateActiveNavState(pageId) {
  document.querySelectorAll("nav button").forEach(btn => {
    btn.classList.remove("active-link");
  });
  
  document.querySelectorAll(`nav button[data-page="${pageId}"]`).forEach(btn => {
    btn.classList.add("active-link");
  });
}

// Add keyboard navigation (press 'h' for home)
document.addEventListener('keydown', (e) => {
  if (e.key === 'h' || e.key === 'H') {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      showPage('home', true);
    }
  }
  
  // Alt + left arrow for back
  if (e.altKey && e.key === 'ArrowLeft') {
    e.preventDefault();
    goBack();
  }
});

// Go back to previous page
function goBack() {
  if (navigationHistory.length > 1) {
    navigationHistory.pop(); // Remove current
    const previousPage = navigationHistory[navigationHistory.length - 1];
    showPage(previousPage, true);
  } else {
    showPage('home', true);
  }
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

  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);
  
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

    if (!name || !email || !message) {
      showFormResponse(response, "Please fill in all fields", "red");
      return;
    }

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

  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);
  
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
window.goBack = goBack;

// Re-initialize on page show
window.addEventListener('pageshow', function(event) {
  handleUrlHash();
  setupNavigation();
  addBackToHomeButton();
  updateAuthButton();
});