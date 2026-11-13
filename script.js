
const commandGrid = document.getElementById("commandGrid");
const searchInput = document.getElementById("commandSearch");
const filters = document.getElementById("commandFilters");

let commands = [];
let activeFilter = "all";

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function renderCommands() {
  const search = searchInput.value.trim().toLowerCase();

  const results = commands.filter(command => {
    const searchable = [
      command.name,
      command.usage,
      command.category,
      command.description
    ].join(" ").toLowerCase();

    const matchesSearch = searchable.includes(search);
    const matchesCategory =
      activeFilter === "all" ||
      command.category === activeFilter;

    return matchesSearch && matchesCategory;
  });

  if (results.length === 0) {
    commandGrid.innerHTML =
      '<div class="empty-state">No commands found. Try another search.</div>';
    return;
  }

  commandGrid.innerHTML = results.map(command => `
    <article class="command-card">
      <code>${escapeHTML(command.usage || "," + command.name)}</code>
      <p>${escapeHTML(command.description || "No description available.")}</p>
      <span class="command-category">
        ${escapeHTML(command.category || "Other")}
      </span>
    </article>
  `).join("");
}

async function loadCommands() {
  try {
    const response = await fetch("./commands.json");

    if (!response.ok) {
      throw new Error("Command file could not be loaded.");
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Invalid command list.");
    }

    commands = data;
    renderCommands();

  } catch (error) {
    commandGrid.innerHTML =
      '<div class="empty-state">Unable to load commands right now.</div>';

    console.error(error);
  }
}

searchInput.addEventListener("input", renderCommands);

filters.addEventListener("click", event => {
  const button = event.target.closest("button[data-filter]");

  if (!button) return;

  activeFilter = button.dataset.filter;

  filters.querySelectorAll("button").forEach(filter => {
    filter.classList.toggle("active", filter === button);
  });

  renderCommands();
});

loadCommands();
