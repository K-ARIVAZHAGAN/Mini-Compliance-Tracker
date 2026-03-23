const state = {
  clients: [],
  selectedClientId: null,
  tasks: [],
  stats: null,
  searchTerm: ""
};

const clientListEl = document.getElementById("client-list");
const clientFormEl = document.getElementById("client-form");
const clientFormMessageEl = document.getElementById("client-form-message");
const selectedClientEl = document.getElementById("selected-client");
const taskListEl = document.getElementById("task-list");
const taskFormEl = document.getElementById("task-form");
const messageEl = document.getElementById("form-message");
const statusFilterEl = document.getElementById("status-filter");
const categoryFilterEl = document.getElementById("category-filter");
const sortFilterEl = document.getElementById("sort-filter");
const searchFilterEl = document.getElementById("search-filter");
const summaryEl = document.getElementById("summary");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(body.error || "Request failed");
  }
  return response.json();
}

async function loadClients(preferredClientId = null) {
  state.clients = await fetchJson("/api/clients");
  renderClients();

  if (state.clients.length === 0) {
    state.selectedClientId = null;
    selectedClientEl.textContent = "Select a client";
    taskListEl.innerHTML = '<p class="empty">No tasks found for this filter.</p>';
    state.stats = null;
    renderSummary();
    return;
  }

  const existingSelected = state.clients.find((client) => client.id === state.selectedClientId);
  const preferredSelected = state.clients.find((client) => client.id === preferredClientId);
  const nextClientId =
    (preferredSelected && preferredSelected.id) ||
    (existingSelected && existingSelected.id) ||
    state.clients[0].id;

  await selectClient(nextClientId);
}

function renderClients() {
  clientListEl.innerHTML = "";

  state.clients.forEach((client) => {
    const li = document.createElement("li");
    li.className = "client-item";

    const button = document.createElement("button");
    button.type = "button";
    button.className = client.id === state.selectedClientId ? "active" : "";
    button.innerHTML = `<strong>${escapeHtml(client.company_name)}</strong><span>${escapeHtml(client.country)} | ${escapeHtml(client.entity_type)}</span>`;
    button.addEventListener("click", () => selectClient(client.id));

    li.appendChild(button);
    clientListEl.appendChild(li);
  });
}

async function selectClient(clientId) {
  state.selectedClientId = clientId;
  state.searchTerm = "";
  searchFilterEl.value = "";
  statusFilterEl.value = "";
  categoryFilterEl.value = "";
  sortFilterEl.value = "due_date:asc";

  renderClients();

  const client = state.clients.find((entry) => entry.id === clientId);
  selectedClientEl.textContent = client ? client.company_name : "Select a client";

  await Promise.all([loadTasks(), loadStats()]);
}

function updateCategoryFilter(tasks) {
  const categories = Array.from(new Set(tasks.map((task) => task.category))).sort();
  const current = categoryFilterEl.value;

  categoryFilterEl.innerHTML = '<option value="">All</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilterEl.appendChild(option);
  });

  if (categories.includes(current)) {
    categoryFilterEl.value = current;
  }
}

function renderSummary() {
  if (!state.stats) {
    summaryEl.textContent = "";
    return;
  }

  const statsText = `Total: ${state.stats.total} | Pending: ${state.stats.pending} | Completed: ${state.stats.completed} | Overdue: ${state.stats.overdue}`;
  const filteredText = `Filtered Tasks: ${state.tasks.length}`;
  summaryEl.textContent = `${statsText} | ${filteredText}`;
}

async function loadStats() {
  if (!state.selectedClientId) {
    state.stats = null;
    renderSummary();
    return;
  }

  state.stats = await fetchJson(`/api/clients/${state.selectedClientId}/tasks/stats`);
  renderSummary();
}

function getSortQuery() {
  const value = sortFilterEl.value || "due_date:asc";
  const [sortBy, sortDir] = value.split(":");
  return { sortBy, sortDir };
}

async function loadTasks() {
  if (!state.selectedClientId) {
    taskListEl.innerHTML = "";
    return;
  }

  const params = new URLSearchParams();
  if (statusFilterEl.value) {
    params.set("status", statusFilterEl.value);
  }
  if (categoryFilterEl.value) {
    params.set("category", categoryFilterEl.value);
  }
  if (state.searchTerm) {
    params.set("q", state.searchTerm);
  }

  const sort = getSortQuery();
  params.set("sort_by", sort.sortBy);
  params.set("sort_dir", sort.sortDir);

  state.tasks = await fetchJson(`/api/clients/${state.selectedClientId}/tasks?${params.toString()}`);
  updateCategoryFilter(state.tasks);
  renderTasks();
  renderSummary();
}

function renderTasks() {
  if (state.tasks.length === 0) {
    taskListEl.innerHTML = '<p class="empty">No tasks found for this filter.</p>';
    return;
  }

  const cards = state.tasks
    .map((task) => {
      const overdue = task.status === "Pending" && Number(task.is_overdue) === 1;
      const dueDate = new Date(task.due_date).toLocaleDateString();
      const nextStatus = task.status === "Pending" ? "Completed" : "Pending";

      return `
        <article class="task-card ${overdue ? "overdue" : ""}">
          <h3>${escapeHtml(task.title)}</h3>
          <p>${escapeHtml(task.description || "No description")}</p>
          <div class="meta">
            <span>Category: ${escapeHtml(task.category)}</span>
            <span>Due: ${escapeHtml(dueDate)}</span>
            <span>Priority: ${escapeHtml(task.priority)}</span>
          </div>
          <div class="status-row">
            <span class="status status-${task.status.toLowerCase()}">${escapeHtml(task.status)}</span>
            ${overdue ? '<span class="overdue-label">Overdue</span>' : ""}
            <button type="button" data-task-id="${task.id}" data-next-status="${nextStatus}">Mark ${nextStatus}</button>
          </div>
        </article>
      `;
    })
    .join("");

  taskListEl.innerHTML = cards;

  taskListEl.querySelectorAll("button[data-task-id]").forEach((button) => {
    button.addEventListener("click", () => updateTaskStatus(button.dataset.taskId, button.dataset.nextStatus));
  });
}

async function updateTaskStatus(taskId, status) {
  await fetchJson(`/api/tasks/${taskId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status })
  });

  await Promise.all([loadTasks(), loadStats()]);
}

async function handleTaskSubmit(event) {
  event.preventDefault();
  messageEl.textContent = "";
  messageEl.className = "message";

  if (!state.selectedClientId) {
    messageEl.textContent = "Select a client first.";
    messageEl.className = "message error";
    return;
  }

  const formData = new FormData(taskFormEl);
  const payload = {
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    due_date: formData.get("due_date"),
    priority: formData.get("priority"),
    status: "Pending"
  };

  try {
    await fetchJson(`/api/clients/${state.selectedClientId}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    state.searchTerm = "";
    searchFilterEl.value = "";
    statusFilterEl.value = "";
    categoryFilterEl.value = "";
    sortFilterEl.value = "due_date:asc";

    taskFormEl.reset();
    messageEl.textContent = "Task added successfully.";
    messageEl.className = "message success";
    await Promise.all([loadTasks(), loadStats()]);
  } catch (error) {
    messageEl.textContent = error.message || "Failed to add task";
    messageEl.className = "message error";
  }
}

async function handleClientSubmit(event) {
  event.preventDefault();
  clientFormMessageEl.textContent = "";
  clientFormMessageEl.className = "message";

  const formData = new FormData(clientFormEl);
  const payload = {
    company_name: formData.get("company_name"),
    country: formData.get("country"),
    entity_type: formData.get("entity_type")
  };

  try {
    const insertedClient = await fetchJson("/api/clients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    clientFormEl.reset();
    clientFormMessageEl.textContent = "Client added successfully.";
    clientFormMessageEl.className = "message success";
    await loadClients(insertedClient.id);
  } catch (error) {
    clientFormMessageEl.textContent = error.message || "Failed to add client";
    clientFormMessageEl.className = "message error";
  }
}

const debouncedSearch = debounce(async () => {
  state.searchTerm = searchFilterEl.value.trim();
  await loadTasks();
}, 300);

statusFilterEl.addEventListener("change", loadTasks);
categoryFilterEl.addEventListener("change", loadTasks);
sortFilterEl.addEventListener("change", loadTasks);
searchFilterEl.addEventListener("input", debouncedSearch);
taskFormEl.addEventListener("submit", handleTaskSubmit);
clientFormEl.addEventListener("submit", handleClientSubmit);

loadClients().catch((error) => {
  console.error(error);
  taskListEl.innerHTML = '<p class="empty">Failed to load data. Please refresh.</p>';
});
