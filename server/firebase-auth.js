
import {
  auth,
  firedb,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  signInWithPopup,
  sendEmailVerification,
} from "./firebase-config.js";
import { doc, getDoc, setDoc } from "./firebase-config.js";

export { onAuthStateChanged, auth };
export async function doLogin(toast) {
  const email = document.getElementById("login-email").value.trim();
  const pass = document.getElementById("login-password").value;
  const err = document.getElementById("login-error");
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    if (!cred.user.emailVerified) {
      // Offer to resend verification email
      err.innerHTML =
        'Please verify your email first. <a href="#" id="resend-verify" style="color:var(--gold);text-decoration:underline;cursor:pointer">Resend verification email</a>';
      err.style.display = "block";
      document
        .getElementById("resend-verify")
        .addEventListener("click", async (e) => {
          e.preventDefault();
          try {
            await sendEmailVerification(cred.user);
            err.innerHTML =
              "✅ Verification email resent! Check your inbox & spam folder.";
            err.style.color = "var(--green)";
          } catch (resendErr) {
            err.innerHTML = "Too many requests. Please try again later.";
            err.style.color = "var(--red)";
            console.error("Resend error:", resendErr);
          }
        });
      await fbSignOut(auth);
      return;
    }
    const userDoc = await getDoc(doc(firedb, "users", cred.user.uid));
    if (!userDoc.exists()) {
      err.textContent = "User profile not found";
      err.style.display = "block";
      return;
    }
    const userData = userDoc.data();
    err.style.display = "none";
    if (userData.role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "user.html";
    }
  } catch (e) {
    err.textContent =
      e.code === "auth/invalid-credential"
        ? "Invalid email or password"
        : e.message;
    err.style.display = "block";
  }
}

export async function doGoogleLogin(toast) {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const uid = result.user.uid;
    const userDoc = await getDoc(doc(firedb, "users", uid));
    if (!userDoc.exists()) {
      await setDoc(doc(firedb, "users", uid), {
        name: result.user.displayName || "User",
        email: result.user.email,
        role: "user",
      });
    }
    const data = (await getDoc(doc(firedb, "users", uid))).data();
    if (data.role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "user.html";
    }
  } catch (e) {
    toast("Google sign-in failed: " + e.message);
  }
}

export async function doRegister() {
  const fname = document.getElementById("reg-fname").value.trim();
  const lname = document.getElementById("reg-lname").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const pass = document.getElementById("reg-password").value;
  const phone = (document.getElementById("reg-phone") || {}).value
    ? document.getElementById("reg-phone").value.trim()
    : "";
  const address = (document.getElementById("reg-address") || {}).value
    ? document.getElementById("reg-address").value.trim()
    : "";
  const err = document.getElementById("reg-error");
  if (!fname || !email || !pass) {
    err.textContent = "Please fill all required fields";
    err.style.display = "block";
    return;
  }
  if (pass.length < 6) {
    err.textContent = "Password must be at least 6 characters";
    err.style.display = "block";
    return;
  }
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await setDoc(doc(firedb, "users", cred.user.uid), {
      name: fname + " " + lname,
      email,
      role: "user",
      phone: phone || null,
      address: address || "",
    });

    // Send Verification Email
    console.log("Sending verification email to:", email);
    await sendEmailVerification(cred.user);
    console.log("✅ Verification email sent successfully");
    await fbSignOut(auth);

    err.textContent =
      "Verification email sent! Please check your inbox and verify your email before logging in.";
    err.style.color = "var(--green)";
    err.style.display = "block";

    // Clear fields
    document.getElementById("reg-email").value = "";
    document.getElementById("reg-password").value = "";
    if (document.getElementById("reg-phone"))
      document.getElementById("reg-phone").value = "";
    if (document.getElementById("reg-address"))
      document.getElementById("reg-address").value = "";
    return { success: true, message: "Verification email sent" };
  } catch (e) {
    err.textContent =
      e.code === "auth/email-already-in-use"
        ? "Email already registered"
        : e.message;
    err.style.color = "var(--red)";
    err.style.display = "block";
    return { success: false, code: e.code, message: e.message };
  }
}

export async function logout() {
  await fbSignOut(auth);
  window.location.href = "index.html";
}

export async function getUserProfile(uid) {
  const userDoc = await getDoc(doc(firedb, "users", uid));
  if (userDoc.exists()) return { id: uid, ...userDoc.data() };
  return null;
}
