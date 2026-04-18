const tabs = document.querySelectorAll("[data-panel-target]");
const panels = document.querySelectorAll(".workspace-panel");

function activatePanel(panelId) {
  panels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.id === panelId);
  });

  tabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.panelTarget === panelId);
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activatePanel(tab.dataset.panelTarget);
    const panel = document.getElementById(tab.dataset.panelTarget);

    if (panel) {
      panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });
});

const summaryValues = {
  users: document.getElementById("summary-users"),
  pokemon: document.getElementById("summary-pokemon"),
  captures: document.getElementById("summary-captures"),
};

function setBaseSummary() {
  summaryValues.users.textContent = "...";
  summaryValues.pokemon.textContent = "Base";
  summaryValues.captures.textContent = "Activa";
}

setBaseSummary();

const userForm = document.getElementById("user-form");
const userFormTitle = document.getElementById("user-form-title");
const userSubmitButton = document.getElementById("user-submit-button");
const userCancelButton = document.getElementById("user-cancel-button");
const userFeedback = document.getElementById("user-feedback");
const usersList = document.getElementById("users-list");
const usersCount = document.getElementById("users-count");
const usersEmptyState = document.getElementById("users-empty-state");
const refreshUsersButton = document.getElementById("refresh-users-button");

const userInputs = {
  cedula: document.getElementById("cedula"),
  nombre: document.getElementById("nombre"),
  email: document.getElementById("email"),
  edad: document.getElementById("edad"),
};

const userState = {
  editingCedula: null,
};

function showFeedback(message, type = "success") {
  userFeedback.textContent = message;
  userFeedback.className = `feedback is-visible is-${type}`;
}

function clearFeedback() {
  userFeedback.textContent = "";
  userFeedback.className = "feedback";
}

function setUserFormMode(isEditing) {
  userState.editingCedula = isEditing ? userInputs.cedula.value.trim() : null;
  userFormTitle.textContent = isEditing ? "Editar entrenador" : "Registrar entrenador";
  userSubmitButton.textContent = isEditing ? "Actualizar usuario" : "Guardar usuario";
  userInputs.cedula.disabled = isEditing;
  userCancelButton.hidden = !isEditing;
}

function resetUserForm() {
  userForm.reset();
  userInputs.cedula.disabled = false;
  setUserFormMode(false);
  clearFeedback();
}

function normalizeMessage(payload, fallbackMessage) {
  if (!payload) {
    return fallbackMessage;
  }

  if (payload.resultado?.erroresValidacion) {
    return payload.resultado.erroresValidacion.split("|").join(" ");
  }

  return payload.mensaje || fallbackMessage;
}

function renderUsers(users) {
  usersList.innerHTML = "";
  usersCount.textContent = `${users.length} usuario${users.length === 1 ? "" : "s"}`;
  summaryValues.users.textContent = String(users.length);

  if (!users.length) {
    usersEmptyState.classList.remove("is-hidden");
    return;
  }

  usersEmptyState.classList.add("is-hidden");

  users.forEach((user) => {
    const card = document.createElement("article");
    card.className = "user-card";
    card.innerHTML = `
      <div class="user-card-head">
        <div>
          <h5>${user.nombre}</h5>
          <p>${user.email}</p>
        </div>
        <span class="user-chip">CC ${user.cedula}</span>
      </div>
      <div class="user-card-meta">
        <p>Edad: ${user.edad}</p>
      </div>
      <div class="user-card-actions">
        <button class="ghost-button" type="button" data-action="edit">Editar</button>
        <button class="ghost-button danger" type="button" data-action="delete">Eliminar</button>
      </div>
    `;

    const editButton = card.querySelector('[data-action="edit"]');
    const deleteButton = card.querySelector('[data-action="delete"]');

    editButton.addEventListener("click", () => {
      clearFeedback();
      userInputs.cedula.value = user.cedula;
      userInputs.nombre.value = user.nombre;
      userInputs.email.value = user.email;
      userInputs.edad.value = user.edad;
      setUserFormMode(true);
      userForm.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    deleteButton.addEventListener("click", async () => {
      const confirmed = window.confirm(`Vas a eliminar a ${user.nombre}. Deseas continuar?`);

      if (!confirmed) {
        return;
      }

      try {
        const response = await fetch(`/api/usuarios/borrar/${user.cedula}`, {
          method: "DELETE",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(normalizeMessage(payload, "No se pudo eliminar el usuario."));
        }

        showFeedback(payload.mensaje || "Usuario eliminado correctamente.");

        if (userState.editingCedula === user.cedula) {
          resetUserForm();
        }

        await loadUsers();
      } catch (error) {
        showFeedback(error.message, "error");
      }
    });

    usersList.appendChild(card);
  });
}

async function loadUsers() {
  try {
    const response = await fetch("/api/usuarios/listar");
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(normalizeMessage(payload, "No se pudo cargar la lista de usuarios."));
    }

    usersEmptyState.textContent = "Aun no hay usuarios cargados.";
    renderUsers(Array.isArray(payload.resultado) ? payload.resultado : []);
  } catch (error) {
    usersList.innerHTML = "";
    usersEmptyState.classList.remove("is-hidden");
    usersEmptyState.textContent = error.message;
    usersCount.textContent = "0 usuarios";
    summaryValues.users.textContent = "0";
  }
}

userForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearFeedback();

  const payload = {
    cedula: userInputs.cedula.value.trim(),
    nombre: userInputs.nombre.value.trim(),
    email: userInputs.email.value.trim(),
    edad: Number(userInputs.edad.value),
  };

  const isEditing = Boolean(userState.editingCedula);
  const endpoint = isEditing
    ? `/api/usuarios/actualizar/${userState.editingCedula}`
    : "/api/usuarios/registrar";
  const method = isEditing ? "PUT" : "POST";

  try {
    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(normalizeMessage(result, "No se pudo guardar el usuario."));
    }

    showFeedback(result.mensaje || "Operacion realizada correctamente.");
    resetUserForm();
    await loadUsers();
  } catch (error) {
    showFeedback(error.message, "error");
  }
});

userCancelButton.addEventListener("click", () => {
  resetUserForm();
});

refreshUsersButton.addEventListener("click", async () => {
  clearFeedback();
  await loadUsers();
});

loadUsers();

let currentPage = 1;
let currentSearch = "";
let currentTipo = "";
const limit = 20;

// =======================
// POKEMON
// =======================

const pokemonList = document.getElementById("pokemon-list");
const pokemonSearch = document.getElementById("pokemon-search");
const pokemonEmptyState = document.getElementById("pokemon-empty-state");
const pokemonCount = document.getElementById("pokemon-count");

function renderPokemon(pokemones, total) {
  pokemonList.innerHTML = "";
  pokemonCount.textContent = `${total} pokémon`;

  if (!pokemones.length) {
    pokemonEmptyState.classList.remove("is-hidden");
    return;
  }

  pokemonEmptyState.classList.add("is-hidden");

  pokemones.forEach((poke) => {
    const card = document.createElement("article");
    card.className = `pokemon-card tipo-bg-${poke.tipo}`;

    card.innerHTML = `
      <div class="pokemon-card-head">
        <h5>${poke.nombre.charAt(0).toUpperCase() + poke.nombre.slice(1)}</h5>
        <span class="pokemon-chip tipo-${poke.tipo}">${poke.tipo}</span>
      </div>

      <img src="${poke.imagen}" alt="${poke.nombre}" class="pokemon-img">

      <div class="pokemon-card-meta">
        <p>Poder: ${poke.poder}</p>
      </div>
    `;

    pokemonList.appendChild(card);
  });
}

async function loadPokemon() {
  try {
    const response = await fetch(
      `/api/pokemon/listar?page=${currentPage}&limit=${limit}&search=${currentSearch}&tipo=${currentTipo}`
    );

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.mensaje || "Error cargando Pokémon");
    }

    renderPokemon(payload.resultado, payload.total);
    renderPagination(payload.totalPaginas);

    summaryValues.pokemon.textContent = payload.total;


  } catch (error) {
    pokemonList.innerHTML = "";
    pokemonEmptyState.classList.remove("is-hidden");
    pokemonEmptyState.textContent = error.message;
    pokemonCount.textContent = "0 pokémon";
  }
}

pokemonSearch.addEventListener("input", () => {
  currentSearch = pokemonSearch.value.toLowerCase();
  currentPage = 1;
  loadPokemon();
});

loadPokemon();

// =======================
// CAPTURAS
// =======================

const capturaUsuario = document.getElementById("captura-usuario");
const capturaPokemon = document.getElementById("captura-pokemon");
const capturarBtn = document.getElementById("capturar-btn");
const capturaFeedback = document.getElementById("captura-feedback");

const buscarUsuarioCaptura = document.getElementById("buscar-usuario-captura");
const verCapturasBtn = document.getElementById("ver-capturas");
const capturasList = document.getElementById("capturas-list");
const pokemonSearchSelect = document.getElementById("pokemon-search-select");
let listaPokemonGlobal = [];

// cargar usuarios en select
async function cargarUsuariosSelect() {
  const res = await fetch("/api/usuarios/listar");
  const data = await res.json();

  capturaUsuario.innerHTML = "";
  

  data.resultado.forEach(u => {
    const option = document.createElement("option");
    option.value = u.cedula;
    option.textContent = `${u.nombre} (${u.cedula})`;
    capturaUsuario.appendChild(option);
  });
}

// cargar pokemon en select
async function cargarPokemonSelect() {
  const res = await fetch("/api/pokemon/listar?limit=1000");
  const data = await res.json();

  listaPokemonGlobal = data.resultado;
  renderPokemonSelect(listaPokemonGlobal);
}

function renderPokemonSelect(lista) {
  capturaPokemon.innerHTML = "";

  lista.forEach(p => {
    const option = document.createElement("option");
    option.value = p.id;
    option.textContent = `${p.nombre} (${p.tipo})`;
    capturaPokemon.appendChild(option);
  });
}

pokemonSearchSelect.addEventListener("input", () => {
  const valor = pokemonSearchSelect.value.toLowerCase();

  const filtrados = listaPokemonGlobal.filter(p =>
    p.nombre.toLowerCase().includes(valor)
  );

  renderPokemonSelect(filtrados);
});

// capturar pokemon
capturarBtn.addEventListener("click", async () => {
  const payload = {
    usuarioCedula: capturaUsuario.value,
    pokemonId: capturaPokemon.value
  };

  try {
    const res = await fetch("/api/captura/capturar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.mensaje);

    capturaFeedback.textContent = data.mensaje;
  } catch (error) {
    capturaFeedback.textContent = error.message;
  }
});

// ver capturas
verCapturasBtn.addEventListener("click", async () => {
  const cedula = buscarUsuarioCaptura.value;

  const res = await fetch(`/api/captura/listar/${cedula}`);
  const data = await res.json();

  capturasList.innerHTML = "";

  if (!data.resultado.length) {
  capturasList.innerHTML = "<p>No hay capturas para este usuario</p>";
  return;
  }

  data.resultado.forEach(c => {
    const div = document.createElement("div");
    div.innerHTML = `
      <div class="captura-card">
        <img src="${c.Pokemon.imagen}" class="captura-img">
        <p>${c.Pokemon.nombre.charAt(0).toUpperCase() + c.Pokemon.nombre.slice(1)}</p>
      </div>
    `;
    capturasList.appendChild(div);
  });
});

async function loadCapturasCount() {
  try {
    const res = await fetch("/api/captura/total");
    const data = await res.json();

    summaryValues.captures.textContent = data.total;
  } catch (error) {
    console.error(error);
  }
}

loadCapturasCount();

// inicializar
cargarUsuariosSelect();
cargarPokemonSelect();

// paginación
const pokemonTipo = document.getElementById("pokemon-tipo");

pokemonTipo.addEventListener("change", () => {
  currentTipo = pokemonTipo.value;
  currentPage = 1;
  loadPokemon();
});

const pagination = document.getElementById("pagination");

function renderPagination(totalPaginas) {
  pagination.innerHTML = "";

  // botón anterior
  const prev = document.createElement("button");
  prev.textContent = "←";
  prev.disabled = currentPage === 1;

  prev.addEventListener("click", () => {
    currentPage--;
    loadPokemon();
  });

  pagination.appendChild(prev);

  // 🔥 limitar cantidad de botones (para que no se vea horrible)
  const maxVisible = 5;
  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPaginas, start + maxVisible - 1);

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;

    if (i === currentPage) {
      btn.classList.add("active");
    }

    btn.addEventListener("click", () => {
      currentPage = i;
      loadPokemon();
    });

    pagination.appendChild(btn);
  }

  // botón siguiente
  const next = document.createElement("button");
  next.textContent = "→";
  next.disabled = currentPage === totalPaginas;

  next.addEventListener("click", () => {
    currentPage++;
    loadPokemon();
  });

  pagination.appendChild(next);
}