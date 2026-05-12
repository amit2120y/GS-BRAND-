import {
  doLogin as _doLogin,
  doGoogleLogin as _doGoogleLogin,
  doRegister as _doRegister,
  forgotPassword as _forgotPassword,
  logout as _logout,
  getUserProfile,
  onAuthStateChanged,
  auth,
} from "./firebase/firebase-auth.js";
import {
  loadProducts,
  saveProductToDB,
  deleteProductFromDB,
  updateProductStock,
  loadOrders,
  createOrder,
  updateOrderStatusInDB,
  loadRequests,
  createRequest,
  updateRequestStatusInDB,
  loadCart,
  saveCart,
  uploadProductImage,
} from "./firebase/firebase-db.js";
import imageCompression from "https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/+esm";

const PRODUCT_IMGS = {
  Footwear: [
    "images/shoe1.jpg",
    "images/shoe2.jpg",
    "images/shoe3.jpg",
    "images/shoe4.jpg",
  ],
  "Cricket Products": [
    "images/bat1.jpg",
    "images/bat2.jpg",
    "images/jersy1.jpg",
  ],
  "Football Products": [
    "images/shoe1.jpg",
    "images/shoe2.jpg",
    "images/shoe3.jpg",
  ],
  Basketball: ["images/image1.jpg", "images/shoe4.jpg", "images/shoe2.jpg"],
  Badminton: ["images/shoe4.jpg", "images/jersy1.jpg", "images/cup1.jpg"],
  "Indoor Game Products": [
    "images/cup1.jpg",
    "images/image1.jpg",
    "images/shoe1.jpg",
  ],
  Jersey: ["images/jersy1.jpg", "images/image1.jpg", "images/shoe2.jpg"],
  Trophy: ["images/cup1.jpg", "images/bat2.jpg", "images/shoe3.jpg"],
};

let db = {
  users: [
    {
      id: "admin",
      email: "admin@gs.com",
      password: "admin123",
      role: "admin",
      name: "Admin",
    },
    {
      id: "u1",
      email: "user@gs.com",
      password: "user123",
      role: "user",
      name: "Rahul Sharma",
    },
  ],
  products: [
    {
      id: "p1",
      name: "GS Pro Runner X1",
      category: "Footwear",
      price: 2999,
      origPrice: 4499,
      stock: 45,
      badge: "HOT",
      img: PRODUCT_IMGS.Footwear[0],
    },
    {
      id: "p2",
      name: "GS Speed Trainer",
      category: "Football Products",
      price: 1799,
      origPrice: 2499,
      stock: 30,
      badge: "SALE",
      img: PRODUCT_IMGS["Football Products"][0],
    },
    {
      id: "p3",
      name: "GS Cricket Bat Pro",
      category: "Cricket Products",
      price: 3499,
      origPrice: 4999,
      stock: 15,
      badge: "",
      img: PRODUCT_IMGS["Cricket Products"][0],
    },
    {
      id: "p4",
      name: "GS Team Jersey",
      category: "Jersey",
      price: 649,
      origPrice: 899,
      stock: 80,
      badge: "NEW",
      img: PRODUCT_IMGS.Jersey[0],
    },
    {
      id: "p5",
      name: "GS Air Boost 2.0",
      category: "Basketball",
      price: 4299,
      origPrice: 5999,
      stock: 22,
      badge: "NEW",
      img: PRODUCT_IMGS.Basketball[0],
    },
    {
      id: "p6",
      name: "GS Indoor Carrom Set",
      category: "Indoor Game Products",
      price: 899,
      origPrice: 1299,
      stock: 60,
      badge: "",
      img: PRODUCT_IMGS["Indoor Game Products"][0],
    },
    {
      id: "p7",
      name: "GS Badminton Racket",
      category: "Badminton",
      price: 1299,
      origPrice: 1899,
      stock: 35,
      badge: "",
      img: PRODUCT_IMGS.Badminton[1],
    },
    {
      id: "p8",
      name: "GS Victory Trophy",
      category: "Trophy",
      price: 1499,
      origPrice: 1999,
      stock: 50,
      badge: "",
      img: PRODUCT_IMGS.Trophy[0],
    },
  ],
  orders: [
    {
      id: "ORD001",
      userId: "u1",
      userName: "Rahul Sharma",
      productId: "p1",
      productName: "GS Pro Runner X1",
      qty: 1,
      total: 2999,
      status: "Delivered",
      date: "2025-04-20",
    },
    {
      id: "ORD002",
      userId: "u1",
      userName: "Rahul Sharma",
      productId: "p4",
      productName: "GS Performance Gloves",
      qty: 2,
      total: 1298,
      status: "Processing",
      date: "2025-05-01",
    },
  ],
  requests: [
    {
      id: "req1",
      userId: "u1",
      userName: "Rahul Sharma",
      type: "Return / Refund",
      subject: "Defective gloves received",
      message: "The gloves I received have a torn seam.",
      date: "2025-05-02",
      status: "pending",
    },
  ],
  reviews: [],
  cart: {},
};

let currentUser = null;
let editingProductId = null;
let currentReqFilter = "pending";

function pid() {
  return "p" + Date.now();
}
function oid() {
  return "ORD" + Math.floor(Math.random() * 90000 + 10000);
}
function rid() {
  return "req" + Date.now();
}

function fmt(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}
function fmtDate(d) {
  return new Date(d || Date.now()).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toggleNavMenu(forceOpen) {
  const nav = document.getElementById("main-nav");
  if (!nav) return;
  const nextState =
    typeof forceOpen === "boolean"
      ? forceOpen
      : !nav.classList.contains("nav-open");
  nav.classList.toggle("nav-open", nextState);
  const toggle = nav.querySelector(".nav-toggle");
  if (toggle) toggle.setAttribute("aria-expanded", String(nextState));
}

function setupNavMenu() {
  const nav = document.getElementById("main-nav");
  if (!nav) return;

  document.addEventListener("click", (event) => {
    if (!nav.classList.contains("nav-open")) return;
    const toggle = nav.querySelector(".nav-toggle");
    if (toggle && (toggle === event.target || toggle.contains(event.target)))
      return;
    const links = nav.querySelector(".nav-links");
    if (links && links.contains(event.target)) {
      nav.classList.remove("nav-open");
      return;
    }
    if (!nav.contains(event.target)) nav.classList.remove("nav-open");
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 768) nav.classList.remove("nav-open");
  });
}

// ===== TOAST =====
function toast(msg) {
  const t = document.getElementById("toast");
  if (!t) {
    alert(msg);
    return;
  }
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

function comingSoon(label) {
  const text = label ? `${label} coming soon!` : "Coming soon!";
  toast(text);
}

// ===== NAVIGATION =====
function showPage(id) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo(0, 0);
}

function goHome() {
  showPage("home-page");
  const filter = document.getElementById("home-cat-filter");
  if (filter) filter.value = "";
  renderHomeProducts();
}
function showSection(id) {
  if (id === "shop-page") {
    showPage("shop-page");
    renderShop();
    return;
  }
  showPage("home-page");
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, 100);
}
function filterCategory(cat) {
  showPage("home-page");
  const filter = document.getElementById("home-cat-filter");
  if (filter) filter.value = cat;
  renderHomeProducts();
  setTimeout(() => {
    const el = document.getElementById("shop-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, 100);
}

// ===== THEME =====
function applyTheme(theme) {
  const selectedTheme = theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", selectedTheme);
  const themeBtn = document.getElementById("theme-toggle-btn");
  if (themeBtn) {
    const isDark = selectedTheme === "dark";
    themeBtn.innerHTML = isDark
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>';
    themeBtn.setAttribute(
      "aria-label",
      `Switch to ${isDark ? "light" : "dark"} theme`,
    );
    themeBtn.title = `Switch to ${isDark ? "light" : "dark"} theme`;
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem("gs-theme") || "dark";
  applyTheme(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const nextTheme = currentTheme === "light" ? "dark" : "light";
  applyTheme(nextTheme);
  localStorage.setItem("gs-theme", nextTheme);
}

// ===== AUTH =====
function openLoginModal() {
  document.getElementById("login-modal").classList.add("open");
}
function closeLoginModal() {
  document.getElementById("login-modal").classList.remove("open");
}
function openDeveloperModal() {
  const modal = document.getElementById("developer-modal");
  if (modal) modal.classList.add("open");
}
function closeDeveloperModal() {
  const modal = document.getElementById("developer-modal");
  if (modal) modal.classList.remove("open");
}
function switchAuthTab(tab, el) {
  document
    .querySelectorAll(".mtab")
    .forEach((t) => t.classList.remove("active"));
  if (el) el.classList.add("active");
  // Use the `.hidden` class to control visibility so !important in CSS is respected.
  const loginForm = document.getElementById("login-form");
  const regForm = document.getElementById("register-form");
  if (loginForm) {
    if (tab === "login") loginForm.classList.remove("hidden");
    else loginForm.classList.add("hidden");
  }
  if (regForm) {
    if (tab === "register") regForm.classList.remove("hidden");
    else regForm.classList.add("hidden");
  }
}

async function doLogin() {
  await _doLogin(toast);
}
async function doGoogleLogin() {
  await _doGoogleLogin(toast);
}
async function doRegister() {
  const btn = document.querySelector("#register-form .btn-gold");
  const prevText = btn ? btn.textContent : "Create Account";
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Creating...";
  }
  try {
    const res = await _doRegister();
    if (btn) {
      btn.disabled = false;
      btn.textContent = prevText;
    }
    if (res && res.success) {
      const fn = document.getElementById("reg-fname");
      const ln = document.getElementById("reg-lname");
      if (fn) fn.value = "";
      if (ln) ln.value = "";
      const phoneEl = document.getElementById("reg-phone");
      const addrEl = document.getElementById("reg-address");
      if (phoneEl) phoneEl.value = "";
      if (addrEl) addrEl.value = "";
      const loginBtn = document.querySelector(".mtab");
      if (typeof switchAuthTab === "function" && loginBtn)
        switchAuthTab("login", loginBtn);
      toast("Verification email sent — check your inbox before signing in.");
    }
  } catch (e) {
    if (btn) {
      btn.disabled = false;
      btn.textContent = prevText;
    }
    console.error("Register wrapper error:", e);
  }
}
async function forgotPassword() {
  await _forgotPassword(toast);
}
async function logout() {
  currentUser = null;
  await _logout();
}

function updateNav() {
  const area = document.getElementById("nav-user-area");
  // Some pages (user.html, admin.html) use a different nav structure and
  // don't include `nav-user-area`. Guard against missing element to avoid
  // runtime errors when calling updateNav() from those pages.
  if (!area) return;
  if (currentUser) {
    area.innerHTML = `
      <div style="display:flex; align-items:center; gap:16px;">
        <a onclick="currentUser.role==='admin'?adminTab('profile',null):userTab('profile',null)" class="fs-13 text-muted" style="cursor:pointer; text-decoration:none; color:var(--text)">My Profile</a>
        <div class="user-avatar" onclick="currentUser.role==='admin'?showPage('admin-page'):showPage('user-page')">${currentUser.name.charAt(0)}</div>
        <button class="btn btn-outline btn-sm" onclick="logout()">Logout</button>
      </div>
    `;
  } else {
    area.innerHTML = `<a onclick="openLoginModal()" id="login-link">Login</a><button class="btn btn-gold btn-sm" onclick="openLoginModal()">Sign Up</button>`;
  }
}

async function saveProfile() {
  const nameEl = document.getElementById("profile-name");
  const phoneEl = document.getElementById("profile-phone");
  const addrEl = document.getElementById("profile-address");
  const name = nameEl ? nameEl.value.trim() : "";
  const phone = phoneEl ? phoneEl.value.trim() : "";
  const address = addrEl ? addrEl.value.trim() : "";
  if (!name) {
    toast("Name cannot be empty");
    return;
  }
  try {
    const { doc, updateDoc, firedb } =
      await import("../server/firebase-config.js");
    const payload = { name };
    if (typeof phone !== "undefined") payload.phone = phone;
    if (typeof address !== "undefined") payload.address = address;
    await updateDoc(doc(firedb, "users", currentUser.id), payload);
    currentUser.name = name;
    currentUser.phone = phone;
    currentUser.address = address;
    toast("Profile updated successfully!");
    updateNav();
    setProfileEditMode(false);
    const g = document.getElementById("user-greeting");
    if (g) g.textContent = "Welcome, " + currentUser.name + "!";
  } catch (e) {
    toast("Error updating profile: " + e.message);
  }
}

function setProfileEditMode(isEditing) {
  const nameEl = document.getElementById("profile-name");
  const phoneEl = document.getElementById("profile-phone");
  const addrEl = document.getElementById("profile-address");
  const editBtn = document.getElementById("profile-edit-btn");
  const saveBtn = document.getElementById("profile-save-btn");
  if (nameEl) nameEl.disabled = !isEditing;
  if (phoneEl) phoneEl.disabled = !isEditing;
  if (addrEl) addrEl.disabled = !isEditing;
  if (editBtn) editBtn.classList.toggle("hidden", isEditing);
  if (saveBtn) saveBtn.classList.toggle("hidden", !isEditing);
}

function startProfileEdit() {
  setProfileEditMode(true);
  const nameEl = document.getElementById("profile-name");
  if (nameEl) nameEl.focus();
}

function renderProfile() {
  if (!currentUser) return;
  const nameInput = document.getElementById("profile-name");
  const emailInput = document.getElementById("profile-email");
  const phoneInput = document.getElementById("profile-phone");
  const addrInput = document.getElementById("profile-address");
  if (nameInput) nameInput.value = currentUser.name || "";
  if (emailInput) emailInput.value = currentUser.email || "";
  if (phoneInput) phoneInput.value = currentUser.phone || "";
  if (addrInput) addrInput.value = currentUser.address || "";
  setProfileEditMode(false);
}

// ===== PRODUCT CARD =====
function productCard(p, mode) {
  const img = p.img || PRODUCT_IMGS[p.category]?.[0] || "";
  const discount =
    p.origPrice && p.origPrice > p.price
      ? Math.round((1 - p.price / p.price) * 100)
      : "";
  let actions = "";
  if (mode === "admin") {
    actions = `<div class="product-actions"><button class="btn btn-outline btn-sm" onclick="editProduct('${p.id}')">Edit</button><button class="btn btn-red btn-sm" onclick="deleteProduct('${p.id}')">Delete</button></div>`;
  } else if (mode === "user") {
    actions = `<div class="product-actions"><button class="btn btn-gold btn-sm" style="flex:1" onclick="addToCart('${p.id}')">Add to Cart</button></div>`;
  } else {
    actions = `<div class="product-actions"><button class="btn btn-gold btn-sm" style="flex:1" onclick="${currentUser ? `addToCart('${p.id}')` : "openLoginModal()"}">Add to Cart</button></div>`;
  }
  return `<div class="product-card">
    <div class="product-img" style="background-image:url('${img}')">
      ${p.badge ? `<div class="product-badge">${p.badge}</div>` : ""}
    </div>
    <div class="product-info">
      <div class="product-cat">${p.category}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-price">${fmt(p.price)}${p.origPrice && p.origPrice > p.price ? `<span>${fmt(p.origPrice)}</span>` : ""}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:4px">${p.stock} in stock</div>
      ${actions}
    </div>
  </div>`;
}

// ===== HOME PRODUCTS =====
function renderHomeProducts() {
  const el = document.getElementById("home-products");
  if (!el) return;
  const filter = document.getElementById("home-cat-filter");
  const cat = filter ? filter.value : "";
  const label = document.getElementById("home-cat-label");
  if (label) label.textContent = cat || "All Products";
  let prods = cat ? db.products.filter((p) => p.category === cat) : db.products;
  el.innerHTML = prods.map((p) => productCard(p, "public")).join("");
}

// ===== SHOP PAGE =====
function renderShop() {
  const cat = document.getElementById("shop-cat-filter").value;
  let prods = cat ? db.products.filter((p) => p.category === cat) : db.products;
  document.getElementById("shop-products").innerHTML = prods
    .map((p) => productCard(p, "public"))
    .join("");
}

// ===== ADMIN =====
function adminTab(tab, el) {
  if (!currentUser) return;
  if (window.location.pathname.includes("index.html")) {
    window.location.href = "admin.html?tab=" + tab;
    return;
  }
  document
    .querySelectorAll(".sidebar-item")
    .forEach((i) => i.classList.remove("active"));
  if (el) el.classList.add("active");
  ["dashboard", "products", "orders", "requests", "profile"].forEach((t) => {
    const el2 = document.getElementById("admin-" + t + "-tab");
    if (el2) {
      if (t === tab) {
        el2.classList.remove("hidden");
        el2.style.display = "block";
      } else {
        el2.classList.add("hidden");
        el2.style.display = "";
      }
    }
  });
  if (tab === "products") renderAdminProducts();
  if (tab === "orders") renderAdminOrders();
  if (tab === "requests") renderAdminRequests();
  if (tab === "profile") renderProfile();
}

function renderAdminDashboard() {
  document.getElementById("admin-date").textContent =
    new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const totalRev = db.orders.reduce((s, o) => s + o.total, 0);
  const pending = db.requests.filter((r) => r.status === "pending").length;
  document.getElementById("admin-stat-cards").innerHTML = `
    <div class="stat-card"><div class="sc-label">Total Revenue</div><div class="sc-val text-gold">${fmt(totalRev)}</div><div class="sc-sub">↑ All time</div></div>
    <div class="stat-card"><div class="sc-label">Total Orders</div><div class="sc-val">${db.orders.length}</div></div>
    <div class="stat-card"><div class="sc-label">Products</div><div class="sc-val">${db.products.length}</div></div>
    <div class="stat-card"><div class="sc-label">Pending Requests</div><div class="sc-val text-red">${pending}</div></div>
  `;
  const recent = db.orders.slice(-5).reverse();
  document.getElementById("admin-recent-orders").innerHTML = recent.length
    ? recent
      .map((o) => {
        const p = db.products.find((x) => x.id === o.productId) || {};
        const img = p.img || PRODUCT_IMGS[p.category]?.[0] || "";
        return `
      <div class="admin-order-card">
        <div class="admin-order-header">
          <div class="admin-order-img" style="background-image:url('${img}')"></div>
          <div>
            <div class="admin-order-title">${o.productName}</div>
            <div class="admin-order-row"><span>Customer</span><strong>${o.userName}</strong></div>
          </div>
        </div>
        <div class="admin-order-row"><span>Total</span><strong>${fmt(o.total)}</strong></div>
        <div class="admin-order-row"><span>Status</span><span class="badge ${o.status === "Delivered" ? "badge-green" : o.status === "Processing" || o.status === "Out for Delivery" ? "badge-gold" : "badge-muted"}">${o.status}</span></div>
        <div class="admin-order-row"><span>Actions</span>
          <span class="admin-order-actions">
            <button class="btn btn-outline btn-sm" onclick="openOrderDetails('${o.id}')">View Details</button>
          </span>
        </div>
      </div>
    `;
      })
      .join("")
    : '<div class="admin-orders-empty">No recent orders</div>';
  const rb = document.getElementById("req-badge");
  rb.textContent = pending || "";
  rb.style.display = pending ? "inline" : "none";
}

function renderAdminProducts() {
  document.getElementById("admin-products-table").innerHTML = db.products
    .map(
      (p) => `
    <tr>
      <td><div style="width:48px;height:48px;background:url('${p.img}') center/cover;border-radius:6px"></div></td>
      <td><strong>${p.name}</strong></td>
      <td><span class="badge badge-muted">${p.category}</span></td>
      <td>${fmt(p.price)}</td>
      <td>${p.stock}</td>
      <td><div style="display:flex;gap:8px">
        <button class="btn btn-outline btn-sm" onclick="editProduct('${p.id}')">Edit</button>
        <button class="btn btn-red btn-sm" onclick="deleteProduct('${p.id}')">Delete</button>
      </div></td>
    </tr>
  `,
    )
    .join("");
}

function renderAdminOrders() {
  document.getElementById("admin-orders-table").innerHTML = db.orders.length
    ? db.orders
      .map((o) => {
        const p = db.products.find((x) => x.id === o.productId) || {};
        const img = p.img || PRODUCT_IMGS[p.category]?.[0] || "";
        return `
      <div class="admin-order-card">
        <div class="admin-order-header">
          <div class="admin-order-img" style="background-image:url('${img}')"></div>
          <div>
            <div class="admin-order-title">${o.productName}</div>
            <div class="admin-order-row"><span>Customer</span><strong>${o.userName}</strong></div>
          </div>
        </div>
        <div class="admin-order-row"><span>Qty</span><strong>${o.qty}</strong></div>
        <div class="admin-order-row"><span>Total</span><strong>${fmt(o.total)}</strong></div>
        <div class="admin-order-row"><span>Status</span><span class="badge ${o.status === "Delivered" ? "badge-green" : o.status === "Processing" ? "badge-gold" : "badge-muted"}">${o.status}</span></div>
        <div class="admin-order-row"><span>Actions</span>
          <span class="admin-order-actions">
            <button class="btn btn-outline btn-sm" onclick="openOrderDetails('${o.id}')">View Details</button>
            <select onchange="updateOrderStatus('${o.id}',this.value)">
              <option ${o.status === "Processing" ? "selected" : ""}>Processing</option>
              <option ${o.status === "Shipped" ? "selected" : ""}>Shipped</option>
              <option ${o.status === "Out for Delivery" ? "selected" : ""}>Out for Delivery</option>
              <option ${o.status === "Cancelled" ? "selected" : ""}>Cancelled</option>
            </select>
          </span>
        </div>
      </div>
    `;
      })
      .join("")
    : '<div class="admin-orders-empty">No orders yet</div>';
}

async function updateOrderStatus(id, status) {
  const o = db.orders.find((o) => o.id === id);
  if (o) {
    o.status = status;
    await updateOrderStatusInDB(id, status);
    toast("Order #" + id + " updated to " + status);
  }
}

function renderAdminRequests() {
  const filtered = db.requests.filter((r) => r.status === currentReqFilter);
  document.getElementById("admin-requests-table").innerHTML =
    filtered
      .map(
        (r) => `
    <tr>
      <td>${r.userName}</td><td><span class="badge badge-muted">${r.type}</span></td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.subject}</td>
      <td>${fmtDate(r.date)}</td>
      <td><span class="badge ${r.status === "pending" ? "badge-gold" : r.status === "approved" ? "badge-green" : "badge-red"}">${r.status}</span></td>
      <td><div style="display:flex;gap:6px">
        ${r.status === "pending" ? `<button class="btn btn-green btn-sm" onclick="reviewRequest('${r.id}','approved')">Approve</button><button class="btn btn-red btn-sm" onclick="reviewRequest('${r.id}','rejected')">Reject</button>` : '<span style="color:var(--muted);font-size:12px">Reviewed</span>'}
      </div></td>
    </tr>
  `,
      )
      .join("") ||
    `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:40px">No ${currentReqFilter} requests</td></tr>`;
  const pending = db.requests.filter((r) => r.status === "pending").length;
  const rb = document.getElementById("req-badge");
  rb.textContent = pending || "";
  rb.style.display = pending ? "inline" : "none";
}

function reqTab(status, el) {
  currentReqFilter = status;
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  el.classList.add("active");
  renderAdminRequests();
}

async function reviewRequest(id, status) {
  const r = db.requests.find((r) => r.id === id);
  if (r) {
    r.status = status;
    await updateRequestStatusInDB(id, status);
    renderAdminRequests();
    renderAdminDashboard();
    toast("Request " + status);
  }
}

// ===== PRODUCT MODAL =====
function previewProductImage(input) {
  const file = input.files[0];
  if (!file) return;
  // 10MB limit for Cloudinary
  if (file.size > 10 * 1024 * 1024) {
    toast("Image too large! Maximum size is 10MB.");
    input.value = "";
    return;
  }
  // Store the file for upload during save
  window._pendingImageFile = file;
  // Local preview
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById("img-preview");
    const placeholder = document.getElementById("img-placeholder");
    preview.src = e.target.result;
    preview.style.display = "block";
    placeholder.style.display = "none";
  };
  reader.readAsDataURL(file);
}

function openAddProduct() {
  editingProductId = null;
  document.getElementById("prod-modal-title").textContent = "Add Product";
  [
    "prod-name",
    "prod-price",
    "prod-orig-price",
    "prod-stock",
    "prod-badge",
  ].forEach((id) => (document.getElementById(id).value = ""));
  document.getElementById("prod-cat").value = "Footwear";
  const newCatInput = document.getElementById("prod-new-cat");
  if (newCatInput) newCatInput.value = "";
  toggleNewCategory();
  // Reset image upload
  document.getElementById("prod-img-file").value = "";
  document.getElementById("img-preview").src = "";
  document.getElementById("img-preview").style.display = "none";
  document.getElementById("img-placeholder").style.display = "block";
  window._currentProductImg = null;
  window._pendingImageFile = null;
  document.getElementById("product-modal").classList.add("open");
}
function closeProductModal() {
  document.getElementById("product-modal").classList.remove("open");
}

function editProduct(id) {
  const p = db.products.find((p) => p.id === id);
  if (!p) return;
  editingProductId = id;
  document.getElementById("prod-modal-title").textContent = "Edit Product";
  document.getElementById("prod-name").value = p.name;
  ensureCategoryOption(p.category);
  document.getElementById("prod-cat").value = p.category;
  const newCatInput = document.getElementById("prod-new-cat");
  if (newCatInput) newCatInput.value = "";
  toggleNewCategory();
  document.getElementById("prod-price").value = p.price;
  document.getElementById("prod-orig-price").value = p.origPrice || "";
  document.getElementById("prod-stock").value = p.stock;
  document.getElementById("prod-badge").value = p.badge || "";
  // Show existing image
  const preview = document.getElementById("img-preview");
  const placeholder = document.getElementById("img-placeholder");
  document.getElementById("prod-img-file").value = "";
  window._currentProductImg = p.img || null;
  window._pendingImageFile = null;
  if (p.img) {
    preview.src = p.img;
    preview.style.display = "block";
    placeholder.style.display = "none";
  } else {
    preview.src = "";
    preview.style.display = "none";
    placeholder.style.display = "block";
  }
  document.getElementById("product-modal").classList.add("open");
}

async function saveProduct() {
  const name = document.getElementById("prod-name").value.trim();
  const catSelect = document.getElementById("prod-cat");
  const newCatInput = document.getElementById("prod-new-cat");
  let cat = catSelect ? catSelect.value : "";
  const price = parseInt(document.getElementById("prod-price").value);
  const origPrice =
    parseInt(document.getElementById("prod-orig-price").value) || 0;
  const stock = parseInt(document.getElementById("prod-stock").value) || 0;
  const badge = document
    .getElementById("prod-badge")
    .value.trim()
    .toUpperCase();
  const err = document.getElementById("prod-error");
  if (cat === "__new__") {
    const newCat = newCatInput ? newCatInput.value.trim() : "";
    if (!newCat) {
      err.textContent = "Please enter a new category";
      err.classList.remove("hidden");
      return;
    }
    cat = newCat;
    ensureCategoryOption(cat);
  }
  if (!name || !price) {
    err.textContent = "Name and price are required";
    err.classList.remove("hidden");
    return;
  }
  err.classList.add("hidden");

  const saveBtn = document.querySelector("#product-modal .btn-gold");
  const fallbackImg =
    PRODUCT_IMGS[cat]?.[0] || PRODUCT_IMGS.Footwear?.[0] || "images/image1.jpg";
  let img = window._currentProductImg || fallbackImg;

  // Compress and Upload to Cloudinary if new file selected
  if (window._pendingImageFile) {
    saveBtn.textContent = "Compressing...";
    saveBtn.disabled = true;
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(
        window._pendingImageFile,
        options,
      );

      saveBtn.textContent = "Uploading... 0%";
      img = await uploadProductImage(compressedFile, (pct) => {
        saveBtn.textContent = `Uploading... ${pct}%`;
      });
      window._pendingImageFile = null;
    } catch (e) {
      toast("Upload failed: " + e.message);
      saveBtn.textContent = "Save Product";
      saveBtn.disabled = false;
      return;
    }
  }

  saveBtn.textContent = "Saving...";
  const data = { name, category: cat, price, origPrice, stock, badge, img };
  if (editingProductId) {
    await saveProductToDB(editingProductId, data);
    const p = db.products.find((p) => p.id === editingProductId);
    if (p) Object.assign(p, data);
    toast("Product updated!");
  } else {
    const newId = await saveProductToDB(null, data);
    db.products.push({ id: newId, ...data });
    toast("Product added!");
  }
  saveBtn.textContent = "Save Product";
  saveBtn.disabled = false;
  closeProductModal();
  renderAdminProducts();
  renderAdminDashboard();
}

function ensureCategoryOption(category) {
  const select = document.getElementById("prod-cat");
  if (!select || !category) return;
  const exists = Array.from(select.options).some((o) => o.value === category);
  if (exists) return;
  const opt = document.createElement("option");
  opt.value = category;
  opt.textContent = category;
  const addNewOpt = select.querySelector('option[value="__new__"]');
  if (addNewOpt) select.insertBefore(opt, addNewOpt);
  else select.appendChild(opt);
}

function toggleNewCategory() {
  const select = document.getElementById("prod-cat");
  const wrap = document.getElementById("prod-new-cat-wrap");
  if (!select || !wrap) return;
  const isNew = select.value === "__new__";
  wrap.classList.toggle("hidden", !isNew);
  if (!isNew) {
    const input = document.getElementById("prod-new-cat");
    if (input) input.value = "";
  }
}

async function deleteProduct(id) {
  await deleteProductFromDB(id);
  db.products = db.products.filter((p) => p.id !== id);
  renderAdminProducts();
  renderAdminDashboard();
  toast("Product deleted");
}

// ===== USER SHOP =====
function renderUserShop() {
  const search =
    (document.getElementById("user-search") || {}).value?.toLowerCase() || "";
  const cat = (document.getElementById("user-cat-filter") || {}).value || "";
  let prods = db.products;
  if (cat) prods = prods.filter((p) => p.category === cat);
  if (search)
    prods = prods.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search),
    );
  document.getElementById("user-products").innerHTML = prods
    .map((p) => productCard(p, "user"))
    .join("");
}

// ===== CART =====
function getCart() {
  if (!currentUser) return [];
  if (!db.cart[currentUser.id]) db.cart[currentUser.id] = [];
  return db.cart[currentUser.id];
}

async function addToCart(productId) {
  if (!currentUser) {
    openLoginModal();
    return;
  }
  const cart = getCart();
  const existing = cart.find((i) => i.productId === productId);
  const p = db.products.find((p) => p.id === productId);
  if (!p || p.stock <= 0) {
    toast("Out of stock!");
    return;
  }
  if (existing) {
    if (existing.qty >= p.stock) {
      toast("Max stock reached");
      return;
    }
    existing.qty++;
  } else {
    cart.push({ productId, qty: 1 });
  }
  await saveCart(currentUser.id, cart);
  updateCartBadge();
  toast("Added to cart: " + p.name);
}

function updateCartBadge() {
  const cart = getCart();
  const total = cart.reduce((s, i) => s + i.qty, 0);
  const badge = document.getElementById("cart-badge");
  if (badge) {
    badge.textContent = total || "";
    badge.style.display = total ? "inline" : "none";
  }
}

function renderCart() {
  const cart = getCart();
  const itemsEl = document.getElementById("cart-items");
  const emptyEl = document.getElementById("cart-empty");
  const summaryEl = document.getElementById("cart-summary");
  if (!cart.length) {
    itemsEl.style.display = "none";
    emptyEl.style.display = "block";
    summaryEl.innerHTML = "";
    return;
  }
  itemsEl.style.display = "block";
  emptyEl.style.display = "none";
  let subtotal = 0;
  itemsEl.innerHTML = cart
    .map((item) => {
      const p = db.products.find((p) => p.id === item.productId);
      if (!p) return "";
      subtotal += p.price * item.qty;
      return `<div class="cart-item">
      <div class="cart-img" style="background-image:url('${p.img}')"></div>
      <div class="cart-info">
        <div class="cart-name">${p.name}</div>
        <div class="cart-price">${fmt(p.price * item.qty)}</div>
        <div style="font-size:12px;color:var(--muted)">${fmt(p.price)} each</div>
      </div>
      <div class="cart-qty">
        <button class="qty-btn" onclick="changeQty('${p.id}',-1)">−</button>
        <span style="min-width:24px;text-align:center;font-weight:600">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty('${p.id}',1)">+</button>
        <button class="qty-btn" onclick="removeFromCart('${p.id}')" style="color:var(--red);margin-left:4px">×</button>
      </div>
    </div>`;
    })
    .join("");
  const shipping = subtotal > 999 ? 0 : 99;
  const total = subtotal + shipping;
  summaryEl.innerHTML = `
    <div class="order-row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
    <div class="order-row"><span>Shipping</span><span>${shipping === 0 ? '<span class="text-green">FREE</span>' : fmt(shipping)}</span></div>
    <div class="order-total"><span>Total</span><span class="text-gold">${fmt(total)}</span></div><br>
    <div style="font-size:12px;color:var(--muted);text-align:right;margin-top:-8px;margin-bottom:16px">(GST included)</div>
    ${subtotal < 999 ? '<div style="font-size:11px;color:var(--muted);margin-top:8px">Add ₹' + fmt(999 - subtotal) + " more for free shipping</div>" : ""}
  `;
}

async function changeQty(productId, delta) {
  const cart = getCart();
  const item = cart.find((i) => i.productId === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    await removeFromCart(productId);
    return;
  }
  await saveCart(currentUser.id, cart);
  renderCart();
  updateCartBadge();
}

async function removeFromCart(productId) {
  db.cart[currentUser.id] = getCart().filter((i) => i.productId !== productId);
  await saveCart(currentUser.id, db.cart[currentUser.id]);
  renderCart();
  updateCartBadge();
}

async function checkout() {
  const cart = getCart();
  if (!cart.length) return;

  // Ensure user has provided a phone number and an address
  if (!currentUser.phone || !currentUser.address) {
    toast("Please add your phone number and address before placing an order.");
    // Open the Profile section for editing
    userTab("profile", null);
    toggleProfileEdit();
    return;
  }

  for (const item of cart) {
    const p = db.products.find((p) => p.id === item.productId);
    if (!p) continue;
    const total = p.price * item.qty;
    const orderData = {
      userId: currentUser.id,
      userName: currentUser.name,
      productId: p.id,
      productName: p.name,
      qty: item.qty,
      price: total,
      total,
      phone: currentUser.phone,
      address: currentUser.address,
      status: "Processing",
      date: new Date().toISOString().split("T")[0],
    };
    const newId = await createOrder(orderData);
    db.orders.push({ id: newId, ...orderData });
    p.stock = Math.max(0, p.stock - item.qty);
    await updateProductStock(p.id, p.stock);
  }
  db.cart[currentUser.id] = [];
  await saveCart(currentUser.id, []);
  updateCartBadge();
  toast("Order placed successfully!");
  userTab("orders", null);
}

// ===== USER ORDERS =====
function renderUserOrders() {
  const orders = db.orders.filter((o) => o.userId === currentUser.id);
  const grid = document.getElementById("user-orders-grid");
  const empty = document.getElementById("user-orders-empty");
  if (!orders.length) {
    if (grid) grid.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";
  if (!grid) return;
  // Render orders as product-like cards with actions
  grid.innerHTML = orders
    .slice()
    .reverse()
    .map((o) => {
      const p = db.products.find((x) => x.id === o.productId) || {
        name: o.productName,
        category: "",
        img: "",
      };
      const img = p.img || PRODUCT_IMGS[p.category]?.[0] || "";
      const reviewed = !!o.reviewed;
      const actionBtn =
        o.status !== "Delivered"
          ? `<button class="btn btn-gold btn-sm" onclick="confirmDelivery('${o.id}')">Is Delivered</button>`
          : reviewed
            ? `<button class="btn btn-outline btn-sm" disabled>Reviewed</button>`
            : `<button class="btn btn-gold btn-sm" onclick="openReviewModal('${o.id}')">Review & Feedback</button>`;
      return `
      <div class="product-card order-card">
        <div class="product-img" style="background-image:url('${img}')"></div>
        <div class="product-info">
          <div class="product-cat">${p.category}</div>
          <div class="product-name">${p.name}</div>
          <div style="display:flex;align-items:center;gap:12px;margin-top:8px">
            <div style="font-size:14px;color:var(--muted)">Qty: <strong style="color:var(--text);margin-left:6px">${o.qty}</strong></div>
            <div style="font-size:14px;color:var(--muted)">Total: <strong style="color:var(--gold);margin-left:6px">${fmt(o.total)}</strong></div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px">
            <div style="font-size:12px;color:var(--muted)">${fmtDate(o.date)}</div>
            <div><span class="badge ${o.status === "Delivered" ? "badge-green" : o.status === "Processing" || o.status === "Out for Delivery" ? "badge-gold" : "badge-muted"}">${o.status}</span></div>
          </div>
          <div class="order-actions">
            ${actionBtn}
          </div>
        </div>
      </div>
      `;
    })
    .join("");
}

// ===== USER REQUESTS =====
async function submitRequest() {
  const type = document.getElementById("req-type").value;
  const subject = document.getElementById("req-subject").value.trim();
  const message = document.getElementById("req-message").value.trim();
  if (!subject || !message) {
    toast("Please fill all fields");
    return;
  }
  const data = {
    userId: currentUser.id,
    userName: currentUser.name,
    type,
    subject,
    message,
    date: new Date().toISOString().split("T")[0],
    status: "pending",
  };
  const newId = await createRequest(data);
  db.requests.push({ id: newId, ...data });
  document.getElementById("req-subject").value = "";
  document.getElementById("req-message").value = "";
  renderUserRequestsList();
  toast("Request submitted successfully!");
}

function renderUserRequestsList() {
  const reqs = db.requests.filter((r) => r.userId === currentUser.id);
  document.getElementById("user-requests-table").innerHTML =
    reqs
      .reverse()
      .map(
        (r) => `
    <tr>
      <td><span class="badge badge-muted">${r.type}</span></td>
      <td>${r.subject}</td><td>${fmtDate(r.date)}</td>
      <td><span class="badge ${r.status === "pending" ? "badge-gold" : r.status === "approved" ? "badge-green" : "badge-red"}">${r.status}</span></td>
    </tr>
  `,
      )
      .join("") ||
    '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:24px">No requests yet</td></tr>';
}

// ===== ORDER DETAILS + REVIEW HANDLERS =====
async function openOrderDetails(id) {
  const o = db.orders.find((x) => x.id === id);
  if (!o) return;
  const p = db.products.find((x) => x.id === o.productId) || {
    name: o.productName,
    img: "",
  };
  let customer = null;
  try {
    customer = await getUserProfile(o.userId);
  } catch (e) {
    console.error("Failed to load customer profile:", e);
  }
  const container = document.getElementById("order-details-content");
  if (!container) return;
  container.innerHTML = `
    <div style="display:flex;gap:16px;align-items:flex-start">
      <img src="${p.img || ""}" alt="${p.name}" />
      <div style="flex:1">
        <div class="order-detail-row"><div style="font-weight:700">${p.name}</div></div>
        <div class="order-detail-row"><div>Qty: <strong>${o.qty}</strong></div><div>Total: <strong class="text-gold">${fmt(o.total)}</strong></div></div>
        <div class="order-detail-row"><div>Date: ${fmtDate(o.date)}</div></div>
        <div class="order-detail-row"><div>Status: <span class="badge ${o.status === "Delivered" ? "badge-green" : o.status === "Processing" || o.status === "Out for Delivery" ? "badge-gold" : "badge-muted"}">${o.status}</span></div></div>
      </div>
    </div>
    <div class="order-detail-row"><div style="font-weight:700">Customer Details</div></div>
    <div class="order-detail-row"><div>Name: <strong>${o.userName || customer?.name || "Unknown"}</strong></div></div>
    <div class="order-detail-row"><div>Email: <strong>${customer?.email || "Not provided"}</strong></div></div>
    <div class="order-detail-row"><div>Phone: <strong>${customer?.phone || "Not provided"}</strong></div></div>
    <div class="order-detail-row"><div>Address: <strong>${customer?.address || "Not provided"}</strong></div></div>
    <div class="order-detail-row"><div>Order ID: <strong>${o.id}</strong></div></div>
  `;
  document.getElementById("order-details-modal").classList.add("open");
}
function closeOrderDetails() {
  const m = document.getElementById("order-details-modal");
  if (m) m.classList.remove("open");
}

async function confirmDelivery(id) {
  const o = db.orders.find((x) => x.id === id);
  if (!o) return;
  o.status = "Delivered";
  try {
    await updateOrderStatusInDB(id, "Delivered");
  } catch (e) {
    console.error("Failed to persist delivery status:", e);
  }
  toast("Order marked as delivered");
  renderUserOrders();
  try {
    renderAdminDashboard();
  } catch (e) { }
}

function openReviewModal(orderId) {
  const o = db.orders.find((x) => x.id === orderId);
  if (!o) return;
  const el = document.getElementById("review-order-id");
  if (el) el.value = orderId;
  const pq = document.getElementById("review-prod-quality");
  const pk = document.getElementById("review-pack-quality");
  const cm = document.getElementById("review-comment");
  if (pq) pq.value = "Excellent";
  if (pk) pk.value = "Excellent";
  if (cm) cm.value = "";
  window._currentReviewRating = 0;
  setReviewRating(0);
  document.getElementById("review-modal").classList.add("open");
}

function closeReviewModal() {
  const m = document.getElementById("review-modal");
  if (m) m.classList.remove("open");
}

function setReviewRating(val) {
  window._currentReviewRating = Number(val) || 0;
  const stars = document.querySelectorAll("#review-stars .star");
  stars.forEach((s) => {
    const v = Number(s.dataset.value);
    if (window._currentReviewRating && v <= window._currentReviewRating) {
      s.classList.add("filled");
      s.classList.remove("fa-regular");
      s.classList.add("fa-solid");
    } else {
      s.classList.remove("filled");
      s.classList.remove("fa-solid");
      s.classList.add("fa-regular");
    }
  });
  // Remove missing hint when a rating is selected
  const starsWrap = document.getElementById("review-stars");
  if (starsWrap && window._currentReviewRating > 0)
    starsWrap.classList.remove("missing");
}

function submitReview() {
  const orderId = (document.getElementById("review-order-id") || {}).value;
  if (!orderId) return toast("Invalid order");
  const prodEl = document.getElementById("review-prod-quality");
  const packEl = document.getElementById("review-pack-quality");
  const comment = (document.getElementById("review-comment") || {}).value || "";
  const rating = window._currentReviewRating || 0;

  if (!prodEl || !prodEl.value) {
    toast("Please answer: How was the product?");
    return;
  }
  if (!packEl || !packEl.value) {
    toast("Please answer: How was the packing?");
    return;
  }
  if (!rating || rating === 0) {
    const starsWrap = document.getElementById("review-stars");
    if (starsWrap) starsWrap.classList.add("missing");
    toast("Please give a star rating");
    return;
  }

  const o = db.orders.find((x) => x.id === orderId);
  if (!o) return toast("Order not found");
  const review = {
    id: "rev" + Date.now(),
    orderId,
    productId: o.productId,
    userId: currentUser ? currentUser.id : null,
    rating,
    productQuality: prodEl.value,
    packingQuality: packEl.value,
    comment,
    date: new Date().toISOString().split("T")[0],
  };
  db.reviews.push(review);
  o.reviewed = true;
  toast("Thanks for your feedback!");
  closeReviewModal();
  renderUserOrders();
}

// ===== USER TAB =====
function userTab(tab, el) {
  if (!currentUser) {
    openLoginModal();
    return;
  }
  if (window.location.pathname.includes("index.html")) {
    window.location.href = "user.html?tab=" + tab;
    return;
  }
  if (el) {
    document
      .querySelectorAll(".sidebar-item")
      .forEach((i) => i.classList.remove("active"));
    el.classList.add("active");
  }
  ["shop", "cart", "orders", "request", "profile"].forEach((t) => {
    const e = document.getElementById("user-" + t + "-tab");
    if (e) {
      if (t === tab) {
        e.classList.remove("hidden");
        e.style.display = "block";
      } else {
        e.classList.add("hidden");
        e.style.display = "";
      }
    }
  });
  if (tab === "shop") renderUserShop();
  if (tab === "cart") renderCart();
  if (tab === "orders") renderUserOrders();
  if (tab === "request") renderUserRequestsList();
  if (tab === "profile") renderProfile();
}

// ===== FIRESTORE DATA LOADING =====
async function loadAllData() {
  try {
    const products = await loadProducts();
    console.log("✅ Products loaded:", products.length);
    if (products.length) db.products = products;
  } catch (e) {
    console.error("❌ Failed to load products:", e.message);
  }
  // Orders and requests require an authenticated user per Firestore rules.
  // Load products for public pages, but skip orders/requests when there's no signed-in user.
  if (!currentUser) return;

  try {
    const orders = await loadOrders();
    console.log("✅ Orders loaded:", orders.length);
    db.orders = orders;
  } catch (e) {
    console.error("❌ Failed to load orders:", e.message);
  }
  try {
    const requests = await loadRequests();
    console.log("✅ Requests loaded:", requests.length);
    db.requests = requests;
  } catch (e) {
    console.error("❌ Failed to load requests:", e.message);
  }
}
async function loadUserCart(uid) {
  try {
    db.cart[uid] = await loadCart(uid);
  } catch (e) {
    console.error("❌ Failed to load cart:", e.message);
    db.cart[uid] = [];
  }
}

// ===== INITIALIZATION =====
initTheme();
setupNavMenu();

onAuthStateChanged(auth, async (user) => {
  const path = window.location.pathname;
  if (user) {
    currentUser = await getUserProfile(user.uid);
    await loadAllData();
    if (currentUser) await loadUserCart(currentUser.id);

    if (path.includes("admin.html")) {
      if (!currentUser || currentUser.role !== "admin") {
        window.location.href = "index.html";
        return;
      }
      adminTab("dashboard", null);
      renderAdminDashboard();
    } else if (path.includes("user.html")) {
      renderUserShop();
      updateCartBadge();
      const g = document.getElementById("user-greeting");
      if (g) g.textContent = "Welcome, " + currentUser.name + "!";
    } else {
      renderHomeProducts();
      updateNav();
    }
    // Handle tab deep-linking
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get("tab");
    if (tab) {
      if (path.includes("admin.html")) adminTab(tab, null);
      else if (path.includes("user.html")) userTab(tab, null);
    }
  } else {
    currentUser = null;
    if (path.includes("admin.html") || path.includes("user.html")) {
      window.location.href = "index.html";
      return;
    }
    await loadAllData();
    renderHomeProducts();
    updateNav();
  }
});

// ===== EXPOSE TO WINDOW (needed for onclick in HTML with type=module) =====
Object.assign(window, {
  goHome,
  showSection,
  filterCategory,
  toggleTheme,
  openLoginModal,
  closeLoginModal,
  openDeveloperModal,
  closeDeveloperModal,
  comingSoon,
  switchAuthTab,
  doLogin,
  doGoogleLogin,
  doRegister,
  forgotPassword,
  logout,
  updateNav,
  renderHomeProducts,
  renderShop,
  adminTab,
  renderAdminDashboard,
  renderAdminProducts,
  renderAdminOrders,
  updateOrderStatus,
  renderAdminRequests,
  reqTab,
  reviewRequest,
  openAddProduct,
  closeProductModal,
  editProduct,
  saveProduct,
  deleteProduct,
  previewProductImage,
  renderUserShop,
  addToCart,
  updateCartBadge,
  renderCart,
  changeQty,
  removeFromCart,
  checkout,
  renderUserOrders,
  submitRequest,
  renderUserRequestsList,
  openOrderDetails,
  closeOrderDetails,
  confirmDelivery,
  openReviewModal,
  closeReviewModal,
  setReviewRating,
  submitReview,
  startProfileEdit,
  toggleNewCategory,
  toggleNavMenu,
  userTab,
  saveProfile,
});
