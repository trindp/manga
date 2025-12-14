import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const auth = window.auth;
const db = window.db;

/* DOM */
const grid = document.getElementById("mangaGrid");
const modal = document.getElementById("modal");

const titleInput = document.getElementById("titleInput");
const imageInput = document.getElementById("imageInput");
const linkInput = document.getElementById("linkInput");
const descInput = document.getElementById("descInput");

let mangaList = [];
let activeId = null;
let dragIndex = null;
let userCollection = null;

/* ---------- AUTH ---------- */
onAuthStateChanged(auth, user => {
  if (!user) return;

  userCollection = collection(db, "users", user.uid, "manga");

  onSnapshot(userCollection, snap => {
    mangaList = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.order - b.order);

    render();
  });
});

/* ---------- RENDER ---------- */
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

    card.addEventListener("dragstart", () => {
      dragIndex = index;
      card.classList.add("dragging");
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      dragIndex = null;
      saveOrder();
    });

    card.addEventListener("dragover", e => e.preventDefault());

    card.addEventListener("drop", () => {
      const temp = mangaList[dragIndex];
      mangaList[dragIndex] = mangaList[index];
      mangaList[index] = temp;
      saveOrder();
    });

    grid.appendChild(card);
  });
}

/* ---------- EDITOR ---------- */
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
  const ref = doc(userCollection, activeId);

  await setDoc(ref, {
    title: titleInput.value || "Untitled",
    img: imageInput.value,
    link: linkInput.value,
    desc: descInput.value,
    order: mangaList.find(m => m.id === activeId).order
  });

  closeEditor();
}

/* ---------- NEW CARD ---------- */
document.getElementById("newCardBtn").onclick = async () => {
  const ref = doc(userCollection);

  await setDoc(ref, {
    title: "New Manga",
    img: "",
    link: "",
    desc: "Click to edit",
    order: mangaList.length
  });
};

/* ---------- ORDER SAVE ---------- */
async function saveOrder() {
  const batch = writeBatch(db);

  mangaList.forEach((m, i) => {
    const ref = doc(userCollection, m.id);
    batch.update(ref, { order: i });
  });

  await batch.commit();
}

/* ---------- BUTTONS ---------- */
document.getElementById("saveBtn").onclick = saveChanges;
document.getElementById("closeBtn").onclick = closeEditor;
