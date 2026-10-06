// Базовый адрес API. Хост берётся от страницы, порт backend — 8000.
const API_BASE = `${location.protocol}//${location.hostname}:8000`;

const addAnketaBtn = document.getElementById("add-anketa-btn");
const anketaFormPanel = document.getElementById("anketa-form-panel");
const anketaForm = document.getElementById("anketa-form");
const anketaTitleInput = document.getElementById("anketa-title");
const anketaCancelBtn = document.getElementById("anketa-cancel");
const anketaListEl = document.getElementById("anketa-list");
const statusEl = document.getElementById("status");
const exportBtn = document.getElementById("export-btn");
const importBtn = document.getElementById("import-btn");
const importInput = document.getElementById("import-input");

let anketas = [];

function showStatus(message, type = "info") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

// Универсальный вызов API с обработкой ошибок.
async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    let detail = "";
    try {
      const data = await response.json();
      detail = typeof data.detail === "string" ? data.detail : "";
    } catch (_) {
      /* тело не JSON — игнорируем */
    }
    throw new Error(detail || `Ошибка запроса (код ${response.status})`);
  }

  if (response.status === 204) return null;
  return response.json();
}

// --- Загрузка и отрисовка ---

async function loadAnketas() {
  showStatus("Загрузка...", "info");
  try {
    anketas = await api("/all_anketa");
    renderAnketas();
    showStatus(anketas.length ? `Анкет: ${anketas.length}` : "", "info");
  } catch (error) {
    anketaListEl.innerHTML = "";
    showStatus(error.message, "error");
  }
}

function renderAnketas() {
  anketaListEl.innerHTML = "";

  if (!anketas.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Пока нет анкет. Нажмите «+ Добавить анкету».";
    anketaListEl.appendChild(empty);
    return;
  }

  for (const anketa of anketas) {
    anketaListEl.appendChild(buildAnketaCard(anketa));
  }
}

function buildAnketaCard(anketa) {
  const card = document.createElement("section");
  card.className = "anketa-card";

  // Заголовок анкеты
  const head = document.createElement("div");
  head.className = "anketa-head";

  const title = document.createElement("h2");
  title.className = "anketa-title";
  title.textContent = anketa.title;

  const delAnketaBtn = document.createElement("button");
  delAnketaBtn.type = "button";
  delAnketaBtn.className = "delete-btn";
  delAnketaBtn.textContent = "Удалить анкету";
  delAnketaBtn.addEventListener("click", async () => {
    if (!confirm(`Удалить анкету «${anketa.title}» вместе со всеми окнами?`)) return;
    try {
      await api(`/delete_anketa/${anketa.id}`, { method: "DELETE" });
      showStatus("Анкета удалена", "success");
      loadAnketas();
    } catch (error) {
      showStatus(error.message, "error");
    }
  });

  head.append(title, delAnketaBtn);

  // Список окон
  const windowsWrap = document.createElement("div");
  windowsWrap.className = "windows";

  if (!anketa.windows.length) {
    const empty = document.createElement("div");
    empty.className = "empty-small";
    empty.textContent = "В анкете пока нет окон.";
    windowsWrap.appendChild(empty);
  } else {
    for (const window of anketa.windows) {
      windowsWrap.appendChild(buildWindowItem(window));
    }
  }

  // Кнопка добавления окна
  const addWindowBtn = document.createElement("button");
  addWindowBtn.type = "button";
  addWindowBtn.className = "btn secondary add-window-btn";
  addWindowBtn.textContent = "+ Добавить окно";

  // Форма окна (скрыта по умолчанию)
  const windowForm = buildWindowForm(anketa.id);

  addWindowBtn.addEventListener("click", () => {
    const isHidden = windowForm.classList.toggle("hidden");
    if (!isHidden) windowForm.querySelector("input").focus();
  });

  card.append(head, windowsWrap, addWindowBtn, windowForm);
  return card;
}

function buildWindowItem(window) {
  const item = document.createElement("div");
  item.className = "window-item";

  const info = document.createElement("div");
  info.className = "window-info";

  const title = document.createElement("div");
  title.className = "window-title";
  title.textContent = window.title;

  const body = document.createElement("div");
  body.className = "window-body";
  body.textContent = window.body || "— без тела окна —";

  info.append(title, body);

  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "delete-btn";
  delBtn.textContent = "Удалить";
  delBtn.addEventListener("click", async () => {
    if (!confirm(`Удалить окно «${window.title}»?`)) return;
    try {
      await api(`/delete_window/${window.id}`, { method: "DELETE" });
      showStatus("Окно удалено", "success");
      loadAnketas();
    } catch (error) {
      showStatus(error.message, "error");
    }
  });

  item.append(info, delBtn);
  return item;
}

function buildWindowForm(anketaId) {
  const form = document.createElement("form");
  form.className = "window-form hidden";

  // Название окна
  const titleField = document.createElement("div");
  titleField.className = "field";
  const titleLabel = document.createElement("label");
  titleLabel.textContent = "Название окна анкеты";
  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.placeholder = "Например: Контактные данные";
  titleInput.required = true;
  titleField.append(titleLabel, titleInput);

  // Тело окна
  const bodyField = document.createElement("div");
  bodyField.className = "field";
  const bodyLabel = document.createElement("label");
  bodyLabel.textContent = "Тело окна";
  const bodyInput = document.createElement("textarea");
  bodyInput.rows = 4;
  bodyInput.placeholder = "Введите содержимое окна...";
  bodyField.append(bodyLabel, bodyInput);

  // Кнопки
  const actions = document.createElement("div");
  actions.className = "form-actions";
  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "btn secondary";
  cancelBtn.textContent = "Отмена";
  const saveBtn = document.createElement("button");
  saveBtn.type = "submit";
  saveBtn.className = "btn primary";
  saveBtn.textContent = "Сохранить окно";
  actions.append(cancelBtn, saveBtn);

  cancelBtn.addEventListener("click", () => {
    form.reset();
    form.classList.add("hidden");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    if (!title) {
      showStatus("Введите название окна", "error");
      titleInput.focus();
      return;
    }

    saveBtn.disabled = true;
    showStatus("Сохранение окна...", "info");
    try {
      await api("/create_window", {
        method: "POST",
        body: JSON.stringify({ anketa_id: anketaId, title, body: body || null }),
      });
      showStatus("Окно добавлено", "success");
      loadAnketas();
    } catch (error) {
      showStatus(error.message, "error");
      saveBtn.disabled = false;
    }
  });

  form.append(titleField, bodyField, actions);
  return form;
}

// --- Создание анкеты ---

addAnketaBtn.addEventListener("click", () => {
  const isHidden = anketaFormPanel.classList.toggle("hidden");
  if (!isHidden) anketaTitleInput.focus();
});

anketaCancelBtn.addEventListener("click", () => {
  anketaForm.reset();
  anketaFormPanel.classList.add("hidden");
});

anketaForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = anketaTitleInput.value.trim();

  if (!title) {
    showStatus("Введите название анкеты", "error");
    anketaTitleInput.focus();
    return;
  }

  const saveBtn = anketaForm.querySelector('button[type="submit"]');
  saveBtn.disabled = true;
  showStatus("Сохранение анкеты...", "info");

  try {
    await api("/create_anketa", {
      method: "POST",
      body: JSON.stringify({ title }),
    });
    anketaForm.reset();
    anketaFormPanel.classList.add("hidden");
    showStatus("Анкета создана", "success");
    loadAnketas();
  } catch (error) {
    showStatus(error.message, "error");
  } finally {
    saveBtn.disabled = false;
  }
});

// --- Экспорт в файл ---

exportBtn.addEventListener("click", () => {
  const data = anketas.map((anketa) => ({
    title: anketa.title,
    windows: anketa.windows.map((window) => ({
      title: window.title,
      body: window.body,
    })),
  }));

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `anketas_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  showStatus(`Экспортировано анкет: ${data.length}`, "success");
});

// --- Импорт из файла ---

importBtn.addEventListener("click", () => importInput.click());

importInput.addEventListener("change", async () => {
  const file = importInput.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!Array.isArray(data)) {
      throw new Error("файл должен содержать массив анкет");
    }

    showStatus("Импорт...", "info");
    await api("/import_anketas", {
      method: "POST",
      body: JSON.stringify(data),
    });
    showStatus("Импорт завершён", "success");
    loadAnketas();
  } catch (error) {
    showStatus(`Ошибка импорта: ${error.message}`, "error");
  } finally {
    importInput.value = "";
  }
});

// Первичная загрузка
loadAnketas();
