// Contact Keeper – CRUD + Kanban + Drag & Drop + LocalStorage + API Sync

const STORAGE_KEY = "contact_keeper_v1";
let contacts = [];
let editingId = null;
const dom = {};
let syncProcessing = false;

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  addAPISyncButtons(); // new
  attachEvents();
  loadFromStorage();
  renderContacts();
  renderKanban();
});

// ---------- DOM CACHE ----------
function cacheDom() {
  dom.contactForm = document.getElementById("contactForm");
  dom.contactId = document.getElementById("contactId");
  dom.name = document.getElementById("name");
  dom.email = document.getElementById("email");
  dom.phone = document.getElementById("phone");
  dom.favorite = document.getElementById("favorite");
  dom.formTitle = document.getElementById("formTitle");
  dom.saveBtn = document.getElementById("saveBtn");
  dom.cancelEditBtn = document.getElementById("cancelEditBtn");
  dom.addContactBtn = document.getElementById("addContactBtn");
  dom.importDemoBtn = document.getElementById("importDemoBtn");

  dom.contactList = document.getElementById("contactList");
  dom.emptyState = document.getElementById("emptyState");
  dom.contactCountLabel = document.getElementById("contactCountLabel");
  dom.lastSyncLabel = document.getElementById("lastSyncLabel");
  dom.toast = document.getElementById("toast");

  dom.toggleViewBtn = document.getElementById("toggleViewBtn");
  dom.listView = document.getElementById("listView");
  dom.kanbanView = document.getElementById("kanbanView");
  dom.todoCol = document.getElementById("todoCol");
  dom.progressCol = document.getElementById("progressCol");
  dom.doneCol = document.getElementById("doneCol");

  dom.headerActions = document.querySelector(".header-actions");
}

// ---------- ADD API SYNC BUTTONS ----------
function addAPISyncButtons() {
  const syncBtn = document.createElement("button");
  syncBtn.id = "syncAllBtn";
  syncBtn.className = "btn btn-ghost";
  syncBtn.textContent = "Sync with API";
  dom.headerActions.appendChild(syncBtn);

  dom.syncAllBtn = syncBtn;
}

// ---------- EVENT LISTENERS ----------
function attachEvents() {
  dom.contactForm.addEventListener("submit", handleFormSubmit);
  dom.cancelEditBtn.addEventListener("click", resetFormAndFocus);
  dom.addContactBtn.addEventListener("click", () => { resetForm(); dom.name.focus(); });
  dom.importDemoBtn.addEventListener("click", importDemoContacts);
  dom.toggleViewBtn.addEventListener("click", toggleView);
  dom.syncAllBtn.addEventListener("click", syncAllContactsAPI);

  dom.phone.addEventListener("input", () => {
    dom.phone.value = dom.phone.value.replace(/\D/g, "");
  });
}

// ---------- STORAGE ----------
function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  contacts = raw ? JSON.parse(raw) : [];
  contacts = contacts.map(c => ({ ...c, dirty: c.dirty ?? false, status: c.status ?? "todo" }));
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(16).slice(2);
}

// ---------- FORM SUBMIT (CREATE / UPDATE) ----------
function handleFormSubmit(e) {
  e.preventDefault();
  clearErrors();

  const name = dom.name.value.trim();
  const email = dom.email.value.trim();
  const phone = dom.phone.value.trim();
  const favorite = dom.favorite.checked;

  const errors = validateContact({ name, email, phone });
  if (Object.keys(errors).length) {
    renderErrors(errors);
    showToast("Fix errors before submitting.", true);
    return;
  }

  const now = new Date().toISOString();

  if (editingId) {
    const idx = contacts.findIndex(c => c.id === editingId);
    contacts[idx] = {
      ...contacts[idx], name, email, phone, favorite,
      updatedAt: now, dirty: true
    };
    showToast("Contact update ho gaya");
  } else {
    contacts.unshift({
      id: generateId(),
      name, email, phone, favorite,
      status: "todo",
      createdAt: now,
      updatedAt: now,
      dirty: true,
      source: "local"
    });
    showToast("Contact add ho gaya");
  }

  saveToStorage();
  renderContacts();
  renderKanban();
  resetFormAndFocus();
}

// ---------- VALIDATION ----------
function validateContact({ name, email, phone }) {
  const e = {};
  if (!name) e.name = "Name required";
  if (!email && !phone) {
    e.email = "Enter email or phone";
    e.phone = "Enter phone or email";
  }
  if (email && !/^\S+@\S+\.\S+$/.test(email)) e.email = "Invalid email";
  if (phone && phone.length < 6) e.phone = "Too short";
  return e;
}

function renderErrors(errors) {
  Object.keys(errors).forEach(key => {
    const el = document.querySelector(`[data-error-for="${key}"]`);
    if (el) el.textContent = errors[key];
  });
}

function clearErrors() {
  document.querySelectorAll(".field-error").forEach(e => e.textContent = "");
}

// ---------- EDIT ----------
function editContact(id) {
  const c = contacts.find(x => x.id === id);
  if (!c) return;

  editingId = id;
  dom.contactId.value = id;
  dom.name.value = c.name;
  dom.email.value = c.email;
  dom.phone.value = c.phone;
  dom.favorite.checked = c.favorite;

  dom.formTitle.textContent = "Edit Contact";
  dom.saveBtn.textContent = "Update";
}

// ---------- DELETE ----------
function deleteContact(id) {
  if (!confirm("Pakka Delete Karu?")) return;

  contacts = contacts.filter(c => c.id !== id);
  saveToStorage();
  renderContacts();
  renderKanban();
  showToast("Delete kar diya");
}

// ---------- RENDER CONTACT LIST ----------
function renderContacts() {
  dom.contactList.innerHTML = "";

  if (!contacts.length) {
    dom.emptyState.style.display = "block";
    dom.contactCountLabel.textContent = "0 contacts";
    return;
  }

  dom.emptyState.style.display = "none";
  dom.contactCountLabel.textContent = `${contacts.length} contacts`;

  contacts.forEach(c => {
    const card = document.createElement("article");
    card.className = "contact-card";
    card.innerHTML = `
      <div class="contact-main">
        <div class="contact-name-row">
          <span class="contact-name">${c.name}</span>
        </div>
        <div class="contact-secondary">
          ${c.email ? `📧 ${c.email}` : ""} ${c.phone ? `📞 ${c.phone}` : ""}
        </div>
      </div>
      <div class="contact-meta">
        <span>Created: ${formatDate(c.createdAt)}</span>
      </div>
      <div class="contact-actions">
        <button class="btn btn-secondary btn-icon" onclick="editContact('${c.id}')">Edit</button>
        <button class="btn btn-danger btn-icon" onclick="deleteContact('${c.id}')">Delete</button>
      </div>
    `;

    dom.contactList.appendChild(card);
  });
}

// ---------- KANBAN ----------
function renderKanban() {
  dom.todoCol.innerHTML = "";
  dom.progressCol.innerHTML = "";
  dom.doneCol.innerHTML = "";

  contacts.forEach(c => {
    const card = document.createElement("div");
    card.className = "contact-card drag-card";
    card.draggable = true;
    card.dataset.id = c.id;
    card.innerHTML = `<strong>${c.name}</strong><br>${c.phone || ""}`;
    card.addEventListener("dragstart", dragStart);
    card.addEventListener("dragend", dragEnd);

    if (c.status === "todo") dom.todoCol.appendChild(card);
    if (c.status === "progress") dom.progressCol.appendChild(card);
    if (c.status === "done") dom.doneCol.appendChild(card);
  });

  document.querySelectorAll(".kanban-dropzone").forEach(zone => {
    zone.addEventListener("dragover", allowDrop);
    zone.addEventListener("drop", dropCard);
  });
}

let dragged = null;
function dragStart(e) { dragged = e.target; e.target.classList.add("dragging"); }
function dragEnd(e) { e.target.classList.remove("dragging"); dragged = null; }
function allowDrop(e) { e.preventDefault(); }
function dropCard(e) {
  const id = dragged.dataset.id;
  const newStatus = e.currentTarget.parentElement.dataset.status;
  contacts = contacts.map(c => c.id === id ? { ...c, status: newStatus, dirty: true } : c);
  saveToStorage();
  renderKanban();
  showToast("Moved");
}

// ---------- TOGGLE VIEW ----------
function toggleView() {
  const isList = dom.listView.style.display !== "none";
  dom.listView.style.display = isList ? "none" : "grid";
  dom.kanbanView.style.display = isList ? "grid" : "none";
  dom.toggleViewBtn.textContent = isList ? "Switch to List View" : "Switch to Kanban";
}

// ---------- JSONPLACEHOLDER IMPORT ----------
async function importDemoContacts() {
  try {
    showToast("Import ho raha hai...");
    const res = await fetch("https://jsonplaceholder.typicode.com/users");
    const data = await res.json();
    let added = 0;

    data.slice(0, 5).forEach(u => {
      if (contacts.some(c => c.email === u.email)) return;
      contacts.push({
        id: generateId(),
        name: u.name,
        email: u.email,
        phone: u.phone,
        status: "todo",
        favorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dirty: true,
        source: "api"
      });
      added++;
    });

    saveToStorage();
    renderContacts();
    renderKanban();
    updateLastSyncTime();
    showToast(`Imported ${added} contacts`);
  } catch {
    showToast("Import failed", true);
  }
}

// ---------- API SYNC ----------
async function syncAllContactsAPI() {
  if (syncProcessing) return;
  syncProcessing = true;

  showToast("Syncing with fake API...");

  for (const c of contacts) {
    if (!c.dirty) continue;

    await fetch("https://jsonplaceholder.typicode.com/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(c)
    });

    c.dirty = false;
  }

  updateLastSyncTime();
  saveToStorage();
  renderContacts();
  showToast("Synced");
  syncProcessing = false;
}

// ---------- HELPERS ----------
function formatDate(d) { return new Date(d).toLocaleString(); }

function updateLastSyncTime() {
  dom.lastSyncLabel.textContent = new Date().toLocaleString();
}

function resetFormAndFocus() {
  editingId = null;
  dom.contactForm.reset();
  dom.formTitle.textContent = "New contact";
  dom.saveBtn.textContent = "Save";
  dom.name.focus();
}

function showToast(msg, err = false) {
  dom.toast.textContent = msg;
  dom.toast.className = `toast show ${err ? "error" : ""}`;
  setTimeout(() => dom.toast.className = "toast", 2500);
}
