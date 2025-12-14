/* ================= FIREBASE IMPORTS ================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  onSnapshot,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= FIREBASE INIT ================= */
const firebaseConfig = {
  apiKey: "AIzaSyAFVrFg-k8LNrOyQnai9IFSTHbvENbLyvQ",
  authDomain: "manga-library-13c90.firebaseapp.com",
  projectId: "manga-library-13c90",
  storageBucket: "manga-library-13c90.firebasestorage.app",
  messagingSenderId: "1005548720746",
  appId: "1:1005548720746:web:820843f321c8f2d819b013"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ================= DOM ================= */
const grid = document.getElementById("mangaGrid");
const modal = document.getElementById("modal");
const authModal = document.getElementById("authModal");

const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");

const titleInput = document.getElementById("titleInput");
const imageInput = document.getElementById("imageInput");
const linkInput = document.getElementById("linkInput");
const descInput = document.getElementById("descInput");

const newCardBtn = document.getElementById("newCardBtn");
const saveBtn = document.getElementById("saveBtn");
const closeBtn = document.getElementById("closeBtn");

/* ================= STATE ================= */
let mangaList = [];
let activeId = null;
let dragIndex = null;
let userCollection = null;

/* ================= AUTH STATE ================= */
onAuthStateChanged(auth, user => {
  if (!user) {
    authModal.style.display = "block";
    return;
  }

  console.log("Logged in UID:", user.uid);
  authModal.style.display = "none";

  userCollection = collection(db, "users", user.uid, "manga");

  onSnapshot(userCollection, snap => {
    mangaList = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.order - b.order);

    render();
  });
});

/* ================= AUTH ACTIONS ================= */
document.getElementById("registerBtn").onclick = async () => {
  await createUserWithEmailAndPassword(
    auth,
    emailInput.value,
    passwordInput.value
  );
};

document.getElementById("loginBtn").onclick = async () => {
  await signInWithEmailAndPassword(
    auth,
    emailInput.value,
    passwordInput.value
  );
};

/* ================= RENDER ================= */
function render() {
  grid.innerHTML = "";

  mangaList.forEach((m, index) => {
    const card = document.createElement("div");
    card.className = "manga-card";
    card.draggable = true;

    card.innerHTML = `
      <img src="${m.img || "https://via.placeholder.com/400x600"}">
      <div class="manga-info">
        <div class="manga-title">${m.title}</div>
        <div class="manga-desc">${m.desc}</div>
        ${m.link ? `<a class="open-btn" href="${m.link}" target="_blank">Open</a>` : ""}
      </div>
    `;

    card.onclick = e => {
      if (e.target.classList.contains("open-btn")) return;
      openEditor(m.id);
    };

    card.addEventListener("dragstart", () => dragIndex = index);
    card.addEventListener("dragover", e => e.preventDefault());
    card.addEventListener("drop", () => {
      [mangaList[dragIndex], mangaList[index]] =
        [mangaList[index], mangaList[dragIndex]];
      saveOrder();
    });

    grid.appendChild(card);
  });
}

/* ================= EDITOR ================= */
function openEditor(id) {
  activeId = id;
  const m = mangaList.find(x => x.id === id);

  titleInput.value = m.title;
  imageInput.value = m.img;
  linkInput.value = m.link;
  descInput.value = m.desc;

  modal.classList.remove("hidden");
}

function closeEditor() {
  modal.classList.add("hidden");
}

async function saveChanges() {
  const current = mangaList.find(m => m.id === activeId);

  await setDoc(doc(userCollection, activeId), {
    title: titleInput.value,
    img: imageInput.value,
    link: linkInput.value,
    desc: descInput.value,
    order: current.order
  });

  closeEditor();
}

/* ================= NEW CARD ================= */
newCardBtn.onclick = async () => {
  await setDoc(doc(userCollection), {
    title: "New Manga",
    img: "",
    link: "",
    desc: "Click to edit",
    order: mangaList.length
  });
};

/* ================= ORDER SAVE ================= */
async function saveOrder() {
  const batch = writeBatch(db);

  mangaList.forEach((m, i) => {
    batch.update(doc(userCollection, m.id), { order: i });
  });

  await batch.commit();
}

/* ================= BUTTONS ================= */
saveBtn.onclick = saveChanges;
closeBtn.onclick = closeEditor;
