// ============================================
// GS-Brand Sports — Firestore Database Operations
// ============================================
import { firedb } from "./firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
} from "./firebase-config.js";

// ===== CLOUDINARY UPLOAD =====
export async function uploadProductImage(file, onProgress) {
  const CLOUDINARY_CLOUD_NAME = "dqvu09ccf";
  const UPLOAD_PRESET = "uw2k9sl2";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  // Optional: If you created an unsigned preset with a different name in your screenshot, replace "uw2k9sI2" with it.

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    );

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);
        const optimizedUrl = response.secure_url.replace(
          "/upload/",
          "/upload/e_auto_enhance,q_auto,f_auto,w_800,c_limit/",
        );
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
  snap.forEach((d) => products.push({ id: d.id, ...d.data() }));
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
  snap.forEach((d) => orders.push({ id: d.id, ...d.data() }));
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
  snap.forEach((d) => requests.push({ id: d.id, ...d.data() }));
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
  return cartDoc.exists() ? cartDoc.data().items || [] : [];
}

export async function saveCart(uid, items) {
  await setDoc(doc(firedb, "carts", uid), { items });
}
