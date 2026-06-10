const apiUrl = "https://pokeapi.co/api/v2/pokemon/";
const generationApi = "https://pokeapi.co/api/v2/generation/";
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");
const statusBar = document.getElementById("statusBar");
const pokemonImage = document.getElementById("pokemonImage");
const pokemonName = document.getElementById("pokemonName");
const pokemonId = document.getElementById("pokemonId");
const pokemonTypes = document.getElementById("pokemonTypes");
const pokemonStats = document.getElementById("pokemonStats");
const pokemonHeight = document.getElementById("pokemonHeight");
const pokemonWeight = document.getElementById("pokemonWeight");
const pokemonAbilities = document.getElementById("pokemonAbilities");
const pokemonRarityLabel = document.getElementById("pokemonRarityLabel");
const rarityFill = document.getElementById("rarityFill");
const pokemonRarityNote = document.getElementById("pokemonRarityNote");
const generationLabel = document.getElementById("generationLabel");
const generationButtons = document.querySelectorAll(".generation-button");

let currentPokemonId = 1;
let currentGenerationId = null;

async function fetchPokemon(query) {
  const normalizedQuery = String(query).trim().toLowerCase();

  if (!normalizedQuery) {
    statusBar.textContent = "Por favor, insira um nome ou número válido.";
    return;
  }

  setLoadingState(true);

  try {
    const response = await fetch(`${apiUrl}${normalizedQuery}`);

    if (!response.ok) {
      throw new Error("Pokémon não encontrado");
    }

    const pokemon = await response.json();
    const speciesResponse = await fetch(pokemon.species.url);
    const species = speciesResponse.ok ? await speciesResponse.json() : null;

    renderPokemon(pokemon, species);
    currentPokemonId = pokemon.id;
    statusBar.textContent = `Dados carregados para ${capitalize(pokemon.name)}`;
  } catch (error) {
    showError(error.message);
  } finally {
    setLoadingState(false);
  }
}

function renderPokemon(pokemon, species) {
  pokemonImage.src =
    pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default || "";
  pokemonImage.alt = `Imagem de ${pokemon.name}`;
  pokemonName.textContent = capitalize(pokemon.name);
  pokemonId.textContent = `#${String(pokemon.id).padStart(3, "0")}`;

  pokemonTypes.innerHTML = pokemon.types
    .map((typeInfo) => {
      const typeName = typeInfo.type.name;
      return `<span class="type-pill type-${typeName}">${typeName}</span>`;
    })
    .join("");

  pokemonHeight.textContent = `${pokemon.height / 10} m`;
  pokemonWeight.textContent = `${pokemon.weight / 10} kg`;
  pokemonAbilities.textContent = pokemon.abilities
    .map((item) => capitalize(item.ability.name))
    .join(", ");

  const rarity = getRarityInfo(species, pokemon.id);
  pokemonRarityLabel.textContent = rarity.label;
  rarityFill.style.width = rarity.fill + "%";
  pokemonRarityNote.textContent = rarity.note;

  pokemonStats.innerHTML = pokemon.stats
    .map((stat) => {
      const statName = formatStatName(stat.stat.name);
      return `
        <div class="stat-pill">
          <span>${statName}</span>
          <strong>${stat.base_stat}</strong>
        </div>
      `;
    })
    .join("");
}

async function loadGeneration(genId) {
  setLoadingState(true);

  try {
    const response = await fetch(`${generationApi}${genId}`);

    if (!response.ok) {
      throw new Error("Falha ao carregar a geração");
    }

    const generation = await response.json();
    currentGenerationId = genId;
    updateGenerationButtons(genId);
    generationLabel.textContent = `${capitalize(generation.name)} (Gen ${genId})`;

    const species = generation.pokemon_species.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    if (species.length > 0) {
      await fetchPokemon(species[0].name);
    }
  } catch (error) {
    showError(error.message);
  } finally {
    setLoadingState(false);
  }
}

function showError(message) {
  statusBar.textContent = message;
  pokemonImage.src = "";
  pokemonImage.alt = "Imagem indisponível";
  pokemonName.textContent = "Pokémon não encontrado";
  pokemonId.textContent = "#000";
  pokemonTypes.innerHTML = "";
  pokemonStats.innerHTML = "";
  pokemonHeight.textContent = "--";
  pokemonWeight.textContent = "--";
  pokemonAbilities.textContent = "--";
  pokemonRarityLabel.textContent = "Desconhecida";
  rarityFill.style.width = "0%";
  pokemonRarityNote.textContent = "Sem dados de raridade disponíveis";
}

function setLoadingState(isLoading) {
  searchButton.disabled = isLoading;
  prevButton.disabled = isLoading;
  nextButton.disabled = isLoading;
  searchInput.disabled = isLoading;
  generationButtons.forEach((button) => {
    button.disabled = isLoading;
  });

  if (isLoading) {
    statusBar.textContent = "Carregando...";
  }
}

function formatStatName(name) {
  return name
    .replace("special-attack", "Sp. Atk")
    .replace("special-defense", "Sp. Def")
    .replace("hp", "HP")
    .replace("attack", "Atk")
    .replace("defense", "Def")
    .replace("speed", "Speed");
}

function getRarityInfo(species, pokemonId) {
  if (!species) {
    return {
      label: "Desconhecida",
      fill: 20,
      note: "Sem dados de raridade disponíveis",
      habitat: "Desconhecido",
    };
  }

  const captureRate = species.capture_rate || 45;
  const isLegendary = species.is_legendary;
  const isMythical = species.is_mythical;
  const habitat = species.habitat ? capitalize(species.habitat.name) : "Desconhecido";
  let label = "Comum";
  let fill = Math.min(100, Math.max(12, 100 - captureRate));
  let note = `Habitat: ${habitat}`;

  if (isLegendary || isMythical) {
    label = "Lendário";
    fill = 100;
    note = `Espécie rara — ${habitat}`;
  } else if (captureRate < 45) {
    label = "Raro";
    fill = 80;
  } else if (captureRate < 90) {
    label = "Incomum";
    fill = 55;
  }

  return {
    label,
    fill,
    note,
    habitat,
  };
}

function capitalize(text) {
  return String(text).charAt(0).toUpperCase() + String(text).slice(1);
}

function handleSearch() {
  const query = searchInput.value.trim() || currentPokemonId;
  fetchPokemon(query);
}

function handleNext() {
  currentPokemonId = Math.min(currentPokemonId + 1, 1010);
  fetchPokemon(currentPokemonId);
}

function handlePrev() {
  currentPokemonId = Math.max(currentPokemonId - 1, 1);
  fetchPokemon(currentPokemonId);
}

function updateGenerationButtons(activeId) {
  generationButtons.forEach((button) => {
    const buttonGen = Number(button.dataset.gen);
    button.classList.toggle("active", buttonGen === activeId);
  });
}

searchButton.addEventListener("click", handleSearch);
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleSearch();
  }
});
prevButton.addEventListener("click", handlePrev);
nextButton.addEventListener("click", handleNext);

generationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const generationId = Number(button.dataset.gen);
    loadGeneration(generationId);
  });
});

fetchPokemon(currentPokemonId);
