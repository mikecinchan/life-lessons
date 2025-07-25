// ===== 1. FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyDLwjIiM9yO2eUrGIbdj_oLLA7zJe_6yzA",
  authDomain: "life-lessons-app-bad7f.firebaseapp.com",
  projectId: "life-lessons-app-bad7f",
  storageBucket: "life-lessons-app-bad7f.appspot.com",
  messagingSenderId: "892275021764",
  appId: "1:892275021764:web:693ff5ed79fa67d4b17691"
};

// Init Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const lessonsRef = db.collection("life_lessons");

// ===== DOM Elements =====
const loginContainer = document.getElementById("loginContainer");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

const appContainer = document.getElementById("appContainer");
const logoutBtn = document.getElementById("logoutBtn");

const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");
const categoryInput = document.getElementById("category");
const tagsInput = document.getElementById("tags");
const urlInput = document.getElementById("url");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const lessonsList = document.getElementById("lessonsList");
const searchInput = document.getElementById("search");
const categoryFilter = document.getElementById("categoryFilter");

let lessons = [];
let editId = null;

// ===== AUTH STATE LISTENER =====
auth.onAuthStateChanged(user => {
  if (user) {
    console.log("✅ Logged in as:", user.email);
    loginContainer.style.display = "none";
    appContainer.style.display = "block";
    loadLessons(); // only load after login
  } else {
    console.log("🚪 Logged out");
    loginContainer.style.display = "block";
    appContainer.style.display = "none";
  }
});

// ===== LOGIN BUTTON =====
loginBtn.addEventListener("click", async () => {
  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();
  if (!email || !password) {
    loginError.textContent = "Please enter email & password";
    return;
  }
  try {
    await auth.signInWithEmailAndPassword(email, password);
    loginError.textContent = "";
  } catch (err) {
    console.error("Login failed:", err);
    loginError.textContent = err.message;
  }
});

// ===== LOGOUT BUTTON =====
logoutBtn.addEventListener("click", async () => {
  await auth.signOut();
});

// ===== LOAD LESSONS =====
async function loadLessons() {
  try {
    const snapshot = await lessonsRef.orderBy("createdAt", "desc").get();
    lessons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderLessons();
    updateCategoryFilter();
  } catch (err) {
    console.error("Error loading lessons:", err);
  }
}

// ===== SAVE OR UPDATE =====
saveBtn.addEventListener("click", async () => {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();
  const category = categoryInput.value.trim();
  const tags = tagsInput.value.trim();
  const url = urlInput.value.trim();

  if (!title || !content) {
    alert("Title & Content required!");
    return;
  }

  try {
    if (editId) {
      await lessonsRef.doc(editId).update({ title, content, category, tags, url });
      editId = null;
    } else {
      await lessonsRef.add({
        title,
        content,
        category,
        tags,
        url,
        createdAt: firebase.firestore.Timestamp.now()
      });
    }
    clearForm();
    loadLessons();
  } catch (err) {
    console.error("Error saving:", err);
    alert("Save failed: " + err.message);
  }
});

// ===== DELETE LESSON =====
async function deleteLesson(id) {
  if (confirm("Delete this lesson?")) {
    await lessonsRef.doc(id).delete();
    loadLessons();
  }
}

// ===== EDIT LESSON =====
function editLesson(id) {
  const lesson = lessons.find(l => l.id === id);
  if (!lesson) return;
  titleInput.value = lesson.title;
  contentInput.value = lesson.content;
  categoryInput.value = lesson.category;
  tagsInput.value = lesson.tags;
  urlInput.value = lesson.url;
  editId = id;
  cancelBtn.style.display = "block";
}

cancelBtn.addEventListener("click", () => {
  clearForm();
});

function clearForm() {
  titleInput.value = "";
  contentInput.value = "";
  categoryInput.value = "";
  tagsInput.value = "";
  urlInput.value = "";
  editId = null;
  cancelBtn.style.display = "none";
}

// ===== RENDER LESSONS =====
function renderLessons() {
  const searchTerm = searchInput.value.toLowerCase();
  const filterCat = categoryFilter.value;

  let filtered = lessons.filter(
    (lesson) =>
      (lesson.title?.toLowerCase().includes(searchTerm) ||
        lesson.content?.toLowerCase().includes(searchTerm) ||
        (lesson.tags || "").toLowerCase().includes(searchTerm)) &&
      (filterCat === "" || lesson.category === filterCat)
  );

  lessonsList.innerHTML = filtered
    .map(
      (lesson) => `
      <div class="lesson-card">
        <h3>${lesson.title}</h3>
        <p>${lesson.content}</p>
        <p><strong>Category:</strong> ${lesson.category || "-"}</p>
        ${
          lesson.url
            ? `<p>🔗 <a href="${lesson.url}" target="_blank">Reference</a></p>`
            : ""
        }
        <small>Tags: ${lesson.tags || "-"}</small>
        <div class="lesson-actions">
          <button onclick="editLesson('${lesson.id}')">✏️ Edit</button>
          <button onclick="deleteLesson('${lesson.id}')">🗑️ Delete</button>
        </div>
      </div>
    `
    )
    .join("");
}

// ===== UPDATE CATEGORY FILTER =====
function updateCategoryFilter() {
  const categories = [
    ...new Set(lessons.map((lesson) => lesson.category).filter(Boolean)),
  ];
  categoryFilter.innerHTML =
    `<option value="">All Categories</option>` +
    categories.map((c) => `<option value="${c}">${c}</option>`).join("");
}

// ===== SEARCH EVENTS =====
searchInput.addEventListener("input", renderLessons);
categoryFilter.addEventListener("change", renderLessons);
