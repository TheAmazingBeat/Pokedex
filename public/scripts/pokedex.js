const app = document.querySelector('#app');
const API_ROOT = `https://pokeapi.co/api/v2/`;
const ITEMS_PER_PAGE = 54;
let OFFSET = 0;
let pokedex = [];

window.onload = displayPokedex(OFFSET, ITEMS_PER_PAGE);

// Closes modal when clicked outside of it
window.onclick = (e) => {
  // console.log(e.target)
  const modal = document.querySelector('.poke-modal-overlay');
  if (e.target == modal) {
    modal.classList.toggle('show');
  }
};

async function getPokedexData(gameURL) {
  try {
    const response = await fetch(`${API_ROOT}pokedex/1`);

    if (!response.ok) throw new Error();

    const dex = await response.json();
    const pokedex = await Promise.all(
      dex.pokemon_entries.map(async (entry) => {
        const ID_INDEX = 42;
        return await getPokemon(
          `${API_ROOT}pokemon/${entry.pokemon_species.url.substring(ID_INDEX)}`
        );
      })
    );
    // console.log(result)
    return pokedex;
  } catch (error) {
    console.error(`Something went wrong with fetching data`, error);
  }
}

async function getPokemon(pokeURL) {
  try {
    const response = await fetch(pokeURL);

    if (!response.ok) throw new Error();

    const pokeDetails = await response.json();

    const pokemon = {
      id: pokeDetails.id,
      name: pokeDetails.name,
      image: pokeDetails.sprites.other['official-artwork'].front_default,
      typeArray: pokeDetails.types,
    };

    return pokemon;
  } catch (error) {
    console.log(`Something went wrong with fetching pokemon`, error);
  }
}

async function getGames() {
  try {
    const response = await fetch(`${API_ROOT}version-group`);

    if (!response.ok) throw new Error();

    const result = await response.json();

    return result
  } catch (error) {
    console.log(`Something went wrong with fetching game`, error);
  }
}

function createPokemonCard(pokemon, index) {
  const pokeContainer = document.createElement('a');
  pokeContainer.classList.add('poke-container');
  pokeContainer.dataset.index = index;
  pokeContainer.onclick = () => {
    displayPokemonModal(index);
  };
  // pokeContainer.onclick = displayPokemonModal(index);

  const id = document.createElement('p');
  id.classList.add('pokemon-id');
  id.innerText = `#${pokemon.id}`;

  const name = document.createElement('h2');
  name.classList.add('pokemon-name');
  name.innerText = pokemon.name;

  const image = document.createElement('img');
  image.classList.add('pokemon-image');
  image.setAttribute('src', pokemon.image);
  image.setAttribute('alt', `Picture of ${pokemon.name}`);
  image.setAttribute('loading', 'lazy');

  const types = document.createElement('div');
  pokemon.typeArray.forEach((t) => {
    const pokeType = document.createElement('div');
    pokeType.classList.add('type');
    pokeType.classList.add(`${t.type.name}`);
    pokeType.innerText = t.type.name;
    types.append(pokeType);
  });
  types.classList.add('pokemon-types');

  pokeContainer.append(id, name, image, types);

  return pokeContainer;
}

// Create Pagination buttons
function createPagination(limit, spinner) {
  const totalPages = Math.ceil(pokedex.length / ITEMS_PER_PAGE);
  const pageButtons = document.createElement('div');
  pageButtons.classList.add('pagination-buttons');

  function pageControl(controlType) {
    const activePage = document.querySelector('.page-button.active');
    const currentOffset = parseInt(activePage.dataset.offset);
    const buttons = document.querySelectorAll('.page-number');

    if (controlType == 'previous') {
      if (currentOffset == 0) return;

      for (let b = 0; b < buttons.length; b++) {
        if (buttons[b].classList.contains('active')) {
          buttons[b - 1].classList.add('active');
          buttons[b].classList.remove('active');
          break;
        }
      }
      displayPokedex(currentOffset - ITEMS_PER_PAGE, ITEMS_PER_PAGE);
    } else if (controlType == 'next') {
      if (currentOffset == 864) return;

      for (let b = 0; b < buttons.length; b++) {
        if (buttons[b].classList.contains('active')) {
          buttons[b + 1].classList.add('active');
          buttons[b].classList.remove('active');
          break;
        }
      }
      displayPokedex(currentOffset + ITEMS_PER_PAGE, ITEMS_PER_PAGE);
    }
    // Shows spinner
    spinner.classList.toggle('hide');
  }

  // Prev/Next Buttons
  const prevButton = document.createElement('button');
  prevButton.classList.add('page-button');
  prevButton.classList.add('page-control');
  prevButton.innerText = '<';
  prevButton.onclick = () => {
    pageControl('previous');
  };
  pageButtons.append(prevButton);

  const nextButton = document.createElement('button');
  nextButton.classList.add('page-button');
  nextButton.innerText = '>';
  nextButton.onclick = () => {
    pageControl('next');
  };

  // Pages Buttons
  for (let b = 0; b < totalPages; b++) {
    const pageNum = b + 1;

    const button = document.createElement('button');
    button.classList.add('page-button');
    button.classList.add('page-number');

    if (pageNum == 1) button.classList.add('active');
    button.innerText = pageNum;
    button.dataset.offset = OFFSET + limit * b;

    button.onclick = () => {
      const activeBtn = document.querySelector('.page-button.active');
      activeBtn.classList.remove('active');
      button.classList.add('active');

      // Shows spinner
      spinner.classList.toggle('hide');

      displayPokedex(button.dataset.offset, ITEMS_PER_PAGE);
    };

    pageButtons.append(button);
  }

  pageButtons.append(nextButton);

  app.append(pageButtons);
}

function createGameSelection() {
  const selectContainer = document.createElement('div');

  const label = document.createElement('label');
  label.setAttribute('for', 'game-select');
  label.innerText = 'Game:';
  const select = document.createElement('select');
  select.setAttribute('name', 'game-select');
  select.setAttribute('id', 'gameSelect');

  selectContainer.append(label, select);
  app.append(selectContainer);
}

async function displayPokedex(offset, limit) {
  // Deletes the pokemon cards in the current page
  const existingDex = document.querySelector('#dex');
  if (existingDex != null) document.querySelector('#dex').remove();

  // Only get the data once
  if (pokedex.length <= 0) {
    const pokedexData = await getPokedexData();
    pokedex = pokedexData;
  }

  // Creates pokedex element
  const dexContainer = document.createElement('div');
  dexContainer.setAttribute('id', 'dex');

  // Hides the spinner once pokedex is loaded, but cards hasn't rendered
  const spinner = document.querySelector('.spinner');
  spinner.classList.toggle('hide');

  // Display pokemon cards by page
  for (let i = offset; i < limit + offset; i++) {
    // Have reached last pokemon
    if (pokedex[i] == undefined) break;

    dexContainer.append(createPokemonCard(pokedex[i], i));
  }

  createGameSelection();

  // Prevents multiple creation of pagination buttons
  if (document.querySelector('.pagination-buttons') == null)
    createPagination(limit, spinner);

  app.append(dexContainer);

  return pokedex;
}

async function displayPokemonModal(pokeIndex) {
  const pokemon = pokedex[pokeIndex];
  const modal = document.querySelector('.poke-modal-overlay');
  modal.classList.toggle('show');
  const modalHeader = document.querySelector('.modal-header');
  const modalBody = document.querySelector('.modal-body');
  const modalooter = document.querySelector('.modal-footer');

  modalHeader.innerHTML = `<h2 class="pokemon-name">#${pokemon.id} - ${pokemon.name}</h2>`;
  modalBody.innerHTML = `<img src="${pokemon.image}" alt="Picture of ${pokemon.name}" class="pokemon-image" loading="lazy">`;
}

app.innerHTML = `
<h1>PoKAdex</h1>
<div class="spinner"></div>
<div class="poke-modal-overlay">
  <div class="poke-modal">
    <header class="modal-header"></header>
    <main class="modal-body"></main>
    <footer class="modal-footer"></footer>
  </div>
</div>
      
`;