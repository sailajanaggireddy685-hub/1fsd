
const uploadForm = document.getElementById("uploadForm");
const fileInput = document.getElementById("fileInput");
const searchInput = document.getElementById("searchInput");
const filterCategory = document.getElementById("filterCategory");
const notesContainer = document.getElementById("notesContainer");

let notes = [];

try {
  notes = JSON.parse(localStorage.getItem("campusNotes")) || [];
} catch {
  notes = [];
}

let downloadCount = Number(
  localStorage.getItem("campusDownloads") || 0
);

function saveNotes() {
  localStorage.setItem("campusNotes", JSON.stringify(notes));
}

function updateStats() {
  document.getElementById("totalNotes").textContent = notes.length;

  const subjects = new Set(
    notes.map(note => note.subject.toLowerCase())
  );

  document.getElementById("totalSubjects").textContent =
    subjects.size;

  document.getElementById("totalDownloads").textContent =
    downloadCount;
}

function renderNotes() {
  notesContainer.replaceChildren();

  const searchText = searchInput.value.toLowerCase().trim();
  const category = filterCategory.value;

  const filteredNotes = notes.filter(note => {
    const matchesSearch = [
      note.title,
      note.subject,
      note.semester,
      note.uploader,
      note.category,
      note.fileName
    ].some(value =>
      value.toLowerCase().includes(searchText)
    );

    const matchesCategory =
      !category || note.category === category;

    return matchesSearch && matchesCategory;
  });

  if (filteredNotes.length === 0) {
    const message = document.createElement("p");
    message.className = "empty-message";
    message.textContent =
      "No study materials found. Upload your first notes!";
    notesContainer.appendChild(message);
    updateStats();
    return;
  }

  filteredNotes.forEach(note => {
    const card = document.createElement("article");
    card.className = "note-card";

    const icon = document.createElement("div");
    icon.className = "note-icon";
    icon.textContent = "📄";

    const title = document.createElement("h3");
    title.textContent = note.title;

    const subject = document.createElement("p");
    subject.textContent = "Subject: " + note.subject;

    const semester = document.createElement("p");
    semester.textContent = note.semester;

    const uploader = document.createElement("p");
    uploader.textContent = "Uploaded by: " + note.uploader;

    const fileName = document.createElement("p");
    fileName.textContent = "File: " + note.fileName;

    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = note.category;

    const actions = document.createElement("div");
    actions.className = "note-actions";

    const downloadButton = document.createElement("button");
    downloadButton.className = "download-btn";
    downloadButton.textContent = "Download";

    downloadButton.addEventListener("click", () => {
      const link = document.createElement("a");
      link.href = note.fileData;
      link.download = note.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();

      downloadCount++;
      localStorage.setItem(
        "campusDownloads",
        String(downloadCount)
      );

      updateStats();
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", () => {
      const confirmDelete = confirm(
        "Do you want to delete this material?"
      );

      if (confirmDelete) {
        notes = notes.filter(item => item.id !== note.id);
        saveNotes();
        renderNotes();
      }
    });

    actions.append(downloadButton, deleteButton);

    card.append(
      icon,
      title,
      subject,
      semester,
      uploader,
      fileName,
      tag,
      actions
    );

    notesContainer.appendChild(card);
  });

  updateStats();
}

uploadForm.addEventListener("submit", event => {
  event.preventDefault();

  const file = fileInput.files[0];

  if (!file) {
    alert("Please select a file.");
    return;
  }

  const allowedExtensions =
    /\.(pdf|doc|docx|ppt|pptx|txt)$/i;

  if (!allowedExtensions.test(file.name)) {
    alert("Please select a supported document.");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert("File size must not exceed 5 MB.");
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    const note = {
      id: Date.now().toString() +
          Math.random().toString(36).slice(2),
      title: document.getElementById("title").value.trim(),
      subject: document.getElementById("subject").value.trim(),
      semester: document.getElementById("semester").value,
      category: document.getElementById("category").value,
      uploader: document.getElementById("uploader").value.trim(),
      fileName: file.name,
      fileData: reader.result
    };

    notes.unshift(note);

    try {
      saveNotes();
      uploadForm.reset();
      renderNotes();
      alert("Study material uploaded successfully!");
    } catch (error) {
      notes.shift();
      alert(
        "Browser storage is full. Try a smaller file or clear old materials."
      );
    }
  };

  reader.onerror = () => {
    alert("Unable to read the file. Please try again.");
  };

  reader.readAsDataURL(file);
});

searchInput.addEventListener("input", renderNotes);
filterCategory.addEventListener("change", renderNotes);

renderNotes();
