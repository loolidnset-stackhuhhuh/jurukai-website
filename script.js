
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

  if (!results.length) {
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

    if (!response.ok) throw new Error("Could not load commands.");

    const data = await response.json();

    if (!Array.isArray(data)) throw new Error("Invalid command list.");

    commands = data;
    renderCommands();
  } catch (error) {
    commandGrid.innerHTML =
      '<div class="empty-state">Unable to load commands right now.</div>';
    console.error(error);
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
// OPTIMIZED PARTICLES
// ------------------------------

function startParticles() {
  const canvas = document.getElementById("particles");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const mobile = window.innerWidth < 700;

  let width = 0;
  let height = 0;
  let particles = [];
  let animationFrame = null;
  let lastFrame = 0;

  const frameInterval = 1000 / 30;
  const connectionDistance = 115;
  const connectionDistanceSquared =
    connectionDistance * connectionDistance;

  function createParticle() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.2 + 0.5,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      opacity: Math.random() * 0.35 + 0.15
    };
  }

  function resizeCanvas() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);

    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const isMobile = width < 700;
    const count = Math.min(
      isMobile ? 28 : 48,
      Math.max(isMobile ? 16 : 24, Math.floor(
        (width * height) / (isMobile ? 26000 : 22000)
      ))
    );

    particles = Array.from({ length: count }, createParticle);
    drawParticles();
  }

  function drawParticles() {
    ctx.clearRect(0, 0, width, height);

    // Move particles.
    if (!reducedMotion) {
      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;
      }
    }

    // Draw connecting lines without expensive distance calculations.
    ctx.lineWidth = 0.6;

    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];

      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared < connectionDistanceSquared) {
          const opacity =
            (1 - distanceSquared / connectionDistanceSquared) * 0.12;

          ctx.strokeStyle = `rgba(125, 115, 255, ${opacity})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // Draw simple particles without glow effects.
    for (const particle of particles) {
      ctx.beginPath();
      ctx.arc(
        particle.x,
        particle.y,
        particle.size,
        0,
        Math.PI * 2
      );

      ctx.fillStyle = `rgba(165, 155, 255, ${particle.opacity})`;
      ctx.fill();
    }
  }

  function animate(timestamp) {
    if (timestamp - lastFrame >= frameInterval) {
      drawParticles();
      lastFrame = timestamp;
    }

    animationFrame = requestAnimationFrame(animate);
  }

  function stopAnimation() {
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  }

  function startAnimation() {
    if (reducedMotion || document.hidden || animationFrame !== null) {
      return;
    }

    lastFrame = 0;
    animationFrame = requestAnimationFrame(animate);
  }

  resizeCanvas();
  startAnimation();

  window.addEventListener("resize", resizeCanvas);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAnimation();
    } else {
      startAnimation();
    }
  });
}

// ------------------------------
// START
// ------------------------------

loadCommands();
startParticles();
