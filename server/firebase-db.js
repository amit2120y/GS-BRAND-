// ============================================
// GS-Brand Sports — Firestore Database Operations
// ============================================
import { firedb } from "./firebase-config.js";
import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc } from "./firebase-config.js";

// ===== CLOUDINARY UPLOAD =====
const ENV =
  (typeof window !== "undefined" && window.__ENV__ && typeof window.__ENV__ === "object")
    ? window.__ENV__
    : {};

const CLOUDINARY_CLOUD_NAME =
  (import.meta?.env?.VITE_CLOUDINARY_CLOUD_NAME ??
    import.meta?.env?.CLOUDINARY_CLOUD_NAME ??
    ENV.CLOUDINARY_CLOUD_NAME ??
    "");
const CLOUDINARY_API_KEY =
  (import.meta?.env?.VITE_CLOUDINARY_API_KEY ??
    import.meta?.env?.CLOUDINARY_API_KEY ??
    ENV.CLOUDINARY_API_KEY ??
    "");
const CLOUDINARY_API_SECRET =
  (import.meta?.env?.VITE_CLOUDINARY_API_SECRET ??
    import.meta?.env?.CLOUDINARY_API_SECRET ??
    ENV.CLOUDINARY_API_SECRET ??
    "");

async function generateCloudinarySignature(params, secret) {
  const sortedKeys = Object.keys(params).sort();
  const paramString = sortedKeys.map(k => `${k}=${params[k]}`).join("&");
  const stringToSign = paramString + secret;
  const encoder = new TextEncoder();
  const data = encoder.encode(stringToSign);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function uploadProductImage(file, onProgress) {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary config missing. Set CLOUDINARY_* env values.");
  }
  const timestamp = Math.round(new Date().getTime() / 1000);
  const params = {
    timestamp: timestamp,
    folder: "gs-brand-products"
  };

  const signature = await generateCloudinarySignature(params, CLOUDINARY_API_SECRET);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", CLOUDINARY_API_KEY);
  formData.append("timestamp", timestamp);
  formData.append("folder", "gs-brand-products");
  formData.append("signature", signature);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);
        // Apply Cloudinary optimization: auto-enhance, quality auto, auto format, width 800, crop limit
        const optimizedUrl = response.secure_url.replace("/upload/", "/upload/e_auto_enhance,q_auto,f_auto,w_800,c_limit/");
        resolve(optimizedUrl);
      } else {
        const err = JSON.parse(xhr.responseText);
        reject(new Error(err.error?.message || "Upload failed"));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });
}


// ===== PRODUCTS =====
export async function loadProducts() {
  const snap = await getDocs(collection(firedb, "products"));
  const products = [];
  snap.forEach(d => products.push({ id: d.id, ...d.data() }));
  return products;
}

export async function saveProductToDB(id, data) {
  if (id) {
    await updateDoc(doc(firedb, "products", id), data);
    return id;
  } else {
    const ref = await addDoc(collection(firedb, "products"), data);
    return ref.id;
  }
}

export async function deleteProductFromDB(id) {
  await deleteDoc(doc(firedb, "products", id));
}

export async function updateProductStock(id, stock) {
  await updateDoc(doc(firedb, "products", id), { stock });
}

// ===== ORDERS =====
export async function loadOrders() {
  const snap = await getDocs(collection(firedb, "orders"));
  const orders = [];
  snap.forEach(d => orders.push({ id: d.id, ...d.data() }));
  return orders;
}

export async function createOrder(data) {
  const ref = await addDoc(collection(firedb, "orders"), data);
  return ref.id;
}

export async function updateOrderStatusInDB(id, status) {
  await updateDoc(doc(firedb, "orders", id), { status });
}

// ===== REQUESTS =====
export async function loadRequests() {
  const snap = await getDocs(collection(firedb, "requests"));
  const requests = [];
  snap.forEach(d => requests.push({ id: d.id, ...d.data() }));
  return requests;
}

export async function createRequest(data) {
  const ref = await addDoc(collection(firedb, "requests"), data);
  return ref.id;
}

export async function updateRequestStatusInDB(id, status) {
  await updateDoc(doc(firedb, "requests", id), { status });
}

// ===== CART =====
export async function loadCart(uid) {
  const cartDoc = await getDoc(doc(firedb, "carts", uid));
  return cartDoc.exists() ? (cartDoc.data().items || []) : [];
}

export async function saveCart(uid, items) {
  await setDoc(doc(firedb, "carts", uid), { items });
}
