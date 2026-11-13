
const commandGrid = document.getElementById("commandGrid");
const searchInput = document.getElementById("commandSearch");
const filters = document.getElementById("commandFilters");

let commands = [];
let activeFilter = "all";

// ------------------------------
// COMMAND DIRECTORY
// ------------------------------

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
  if (!commandGrid) return;

  const search = searchInput
    ? searchInput.value.trim().toLowerCase()
    : "";

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
      String(command.category || "other").toLowerCase() ===
        activeFilter.toLowerCase();

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
  if (!commandGrid) return;

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

    console.error("Jurukai command directory:", error);
  }
}

if (searchInput) {
  searchInput.addEventListener("input", renderCommands);
}

if (filters) {
  filters.addEventListener("click", event => {
    const button = event.target.closest("button[data-filter]");

    if (!button) return;

    activeFilter = button.dataset.filter || "all";

    filters.querySelectorAll("button[data-filter]").forEach(filter => {
      filter.classList.toggle("active", filter === button);
    });

    renderCommands();
  });
}

// ------------------------------
// BACKGROUND PARTICLES
// ------------------------------

function startParticles() {
  const canvas = document.getElementById("particles");

  if (!canvas) return;

  const context = canvas.getContext("2d");

  if (!context) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let width = 0;
  let height = 0;
  let particles = [];
  let animationFrame = null;

  const connectionDistance = 135;
  const particleSpeed = reducedMotion ? 0 : 0.22;

  function createParticle() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.6 + 0.5,
      speedX: (Math.random() - 0.5) * particleSpeed,
      speedY: (Math.random() - 0.5) * particleSpeed,
      opacity: Math.random() * 0.45 + 0.15
    };
  }

  function resizeCanvas() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const particleCount = Math.min(
      85,
      Math.max(25, Math.floor((width * height) / 14000))
    );

    particles = Array.from(
      { length: particleCount },
      createParticle
    );

    drawParticles();
  }

  function drawParticles() {
    context.clearRect(0, 0, width, height);

    // Draw connecting lines.
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const first = particles[i];
        const second = particles[j];

        const dx = first.x - second.x;
        const dy = first.y - second.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < connectionDistance) {
          const opacity =
            (1 - distance / connectionDistance) * 0.13;

          context.beginPath();
          context.moveTo(first.x, first.y);
          context.lineTo(second.x, second.y);
          context.strokeStyle = `rgba(115, 105, 255, ${opacity})`;
          context.lineWidth = 0.7;
          context.stroke();
        }
      }
    }

    // Draw the particles.
    particles.forEach(particle => {
      context.beginPath();
      context.arc(
        particle.x,
        particle.y,
        particle.size,
        0,
        Math.PI * 2
      );

      context.fillStyle =
        `rgba(155, 145, 255, ${particle.opacity})`;

      context.shadowBlur = 12;
      context.shadowColor = "rgba(110, 95, 255, 0.5)";
      context.fill();
      context.shadowBlur = 0;

      if (!reducedMotion) {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < -10) particle.x = width + 10;
        if (particle.x > width + 10) particle.x = -10;
        if (particle.y < -10) particle.y = height + 10;
        if (particle.y > height + 10) particle.y = -10;
      }
    });
  }

  function animate() {
    drawParticles();
    animationFrame = requestAnimationFrame(animate);
  }

  resizeCanvas();

  if (!reducedMotion) {
    animate();
  }

  window.addEventListener("resize", resizeCanvas);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    } else if (!reducedMotion && animationFrame === null) {
      animate();
    }
  });
}

// ------------------------------
// START WEBSITE
// ------------------------------

loadCommands();
startParticles();
