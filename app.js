// ****** SELECT ITEMS *****:
const container = document.querySelector('.grocery-container');
const list = document.querySelector('.grocery-list');
const clearBtn = document.querySelector('.clear-btn');

const groceryAdd = document.getElementById('grocery-add');
const groceryEdit = document.getElementById('grocery-edit');
const submitAddBtn = document.getElementById('submit-add');
const submitEditBtn = document.getElementById('submit-edit');

// Botão que abre o modal de "Add"
const openAddBtn = document.getElementById('openAddModalBtn');

// edit option
let editElement;
let editFlag = false;
let editID = "";

// ****** EVENT LISTENERS **********
submitAddBtn.addEventListener('click', addItem);
clearBtn.addEventListener('click', ClearItems);

// Delegação para toggle de done (evita um listener por item)
list.addEventListener('click', function (e) {
  // Ignora cliques no botão de editar
  if (e.target.closest('.edit-btn')) return;

  const item = e.target.closest('.grocery-item');
  if (!item) return;

  const id = item.dataset.id;
  const done = !(item.dataset.done === 'true'); // inverte o estado
  setItemDoneUI(item, done);
  toggleDoneInLocalStorage(id, done);
});

// Foco robusto em mobile: acople ao gesto do usuário (pointerup + click fallback)
if (openAddBtn) {
  const onOpenAdd = () => {
    openModal('addModal');
    const input = document.querySelector('#addModal #grocery-add');
    if (!input) return;

    if (!tryFocus(input)) {
      // fallback de ponte para devices teimosos (iOS principalmente)
      focusWithBridge(input);
    }
  };

  openAddBtn.addEventListener('pointerup', onOpenAdd, { passive: true });
  openAddBtn.addEventListener('click', onOpenAdd);
}

// ****** FUNCTIONS **********
function addItem() {
  const value = groceryAdd.value;
  const id = new Date().getTime().toString();

  if (value) {
    const element = document.createElement('article');
    element.classList.add('grocery-item');
    element.setAttribute('data-id', id);
    element.setAttribute('data-done', 'false');

    element.innerHTML = `
      <div class="item-main">
        <img class="item-check" src="Resources/Icons/Check-default.svg" width="20" height="20" alt="">
        <p class="item-name">${value}</p>
      </div>
      <div class="btn-container">
        <button type="button" class="edit-btn" aria-label="Editar">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24" height="24" fill="none">
            <path d="M6 24C6 21.7909 7.79086 20 10 20C12.2091 20 14 21.7909 14 24C14 26.2091 12.2091 28 10 28C7.79086 28 6 26.2091 6 24ZM20 24C20 21.7909 21.7909 20 24 20C26.2091 20 28 21.7909 28 24C28 26.2091 26.2091 28 24 28C21.7909 28 20 26.2091 20 24ZM34 24C34 21.7909 35.7909 20 38 20C40.2091 20 42 21.7909 42 24C42 26.2091 40.2091 28 38 28C35.7909 28 34 26.2091 34 24Z"/>
          </svg>
        </button>
      </div>`;

    // attach only edit event (mantido)
    element.querySelector('.edit-btn').addEventListener('click', editItem);

    // aplica UI inicial
    setItemDoneUI(element, false);

    // append child 
    list.appendChild(element);
    container.classList.add('show-container');

    // add to local storage
    addToLocalStorage(id, value, false);

    // reset input e fechar modal
    groceryAdd.value = "";
    closeModal('addModal');

    // atualiza empty-state
    toggleEmptyState();
  }
}

// Item of the list toggle on and off (se necessário noutros lugares)
function toggleBox() {
  const box = document.getElementById('box');
  box.classList.toggle('active');
}

// empty-state
function toggleEmptyState() {
  const items = document.querySelectorAll('.grocery-item');
  const emptyState = document.querySelector('.empty-state');

  if (!emptyState) return; // segurança

  if (items.length === 0) {
    // nenhum item → mostra o empty state
    emptyState.style.display = 'flex';
  } else {
    // 1 ou mais itens → esconde o empty state
    emptyState.style.display = 'none';
  }
}

// Modal
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  // Evite transform/filters no .modal (bug iOS). Anime apenas .modal-content.
  modal.style.display = "flex";
  modal.style.alignItems = "flex-end";
  modal.style.zIndex = "1000";
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.style.display = "none";
}

// Helper: tenta focar de forma “limpa” e marcar caret no final
function tryFocus(input) {
  input.removeAttribute('readonly');
  input.removeAttribute('disabled');

  input.focus({ preventScroll: true });

  const val = input.value ?? '';
  try { input.setSelectionRange(val.length, val.length); } catch {}

  return document.activeElement === input;
}

// Fallback de “ponte” para forçar teclado em iOS/Android teimosos
function focusWithBridge(targetInput) {
  const bridge = document.createElement('input');
  bridge.type = 'text';
  bridge.autocomplete = 'off';
  bridge.inputMode = 'text';
  Object.assign(bridge.style, {
    position: 'fixed',
    opacity: '0',
    pointerEvents: 'none',
    bottom: '0',
    left: '0',
  });
  document.body.appendChild(bridge);

  bridge.focus();

  setTimeout(() => {
    targetInput.focus({ preventScroll: true });
    const v = targetInput.value ?? '';
    try { targetInput.setSelectionRange(v.length, v.length); } catch {}
    document.body.removeChild(bridge);
  }, 50);
}

// clear items
function ClearItems() {
  const items = document.querySelectorAll('.grocery-item');
  if (items.length > 0) {
    items.forEach(function (item) {
      list.removeChild(item);
    });
  }
  container.classList.remove('show-container');
  setBackToDefault();
  localStorage.removeItem("groceryList");

  // empty-state
  toggleEmptyState();
}

// edit function
function editItem(e) {
  const element = e.currentTarget.closest(".grocery-item");
  editID = element.dataset.id;
  const name = element.querySelector(".item-name").textContent;

  groceryEdit.value = name;
  editFlag = true;
  editElement = element;

  openModal('editModal');

  // Foco no input de edição — aqui o gesto veio do botão de editar (clique do usuário)
  const input = document.querySelector('#editModal #grocery-edit') || groceryEdit;
  if (input && !tryFocus(input)) {
    focusWithBridge(input);
  }
}

// confirmar edição
submitEditBtn.addEventListener('click', function () {
  if (groceryEdit.value && editFlag) {
    editElement.querySelector(".item-name").textContent = groceryEdit.value;
    updateLocalStorage(editID, groceryEdit.value);
    setBackToDefault();
    closeModal('editModal');
  }
});

// deletar direto do modal de edição
function deleteFromEdit() {
  if (editElement) {
    const id = editElement.dataset.id;
    list.removeChild(editElement);
    if (list.children.length === 0) {
      container.classList.remove('show-container');
    }
    setBackToDefault();
    removeFromLocalStorage(id);
    closeModal('editModal');

    // empty-state após deletar
    toggleEmptyState();
  }
}

// set back to default
function setBackToDefault() {
  groceryAdd.value = "";
  groceryEdit.value = "";
  editFlag = false;
  editID = "";
  editElement = null;
}

// toggle de UI done/undone
function setItemDoneUI(element, done) {
  element.dataset.done = String(done);

  // Classe visual
  element.classList.toggle('is-done', done);

  // Ícone
  const img = element.querySelector('.item-check');
  if (img) {
    img.src = done
      ? 'Resources/Icons/Check-done.svg'
      : 'Resources/Icons/Check-default.svg';

    img.style.opacity = done ? '0.5' : '1';
  }
}

// ****** LOCAL STORAGE ****
function addToLocalStorage(id, value, done = false) {
  const groceryItem = { id, value, done };
  const items = getLocalStorage();
  items.push(groceryItem);
  localStorage.setItem("groceryList", JSON.stringify(items));
}

function getLocalStorage() {
  const raw = localStorage.getItem("groceryList");
  let items = [];
  try {
    items = raw ? JSON.parse(raw) : [];
  } catch {
    items = [];
  }
  // migração: garante a propriedade done
  return items.map(it => ({ id: it.id, value: it.value, done: Boolean(it.done) }));
}

function updateLocalStorage(id, newValue) {
  let items = getLocalStorage();
  items = items.map(item => {
    if (item.id === id) {
      return { ...item, value: newValue };
    }
    return item;
  });
  localStorage.setItem("groceryList", JSON.stringify(items));
}

function toggleDoneInLocalStorage(id, done) {
  let items = getLocalStorage();
  items = items.map(item => {
    if (item.id === id) {
      return { ...item, done };
    }
    return item;
  });
  localStorage.setItem("groceryList", JSON.stringify(items));
}

function removeFromLocalStorage(id) {
  let items = getLocalStorage();
  items = items.filter(item => item.id !== id);
  localStorage.setItem("groceryList", JSON.stringify(items));
}

// ****** SETUP ITEMS **********
window.addEventListener('DOMContentLoaded', setupItems);

function setupItems() {
  const items = getLocalStorage();
  if (items.length > 0) {
    items.forEach(item => {
      createListItem(item.id, item.value, item.done);
    });
    container.classList.add("show-container");
  }

  toggleEmptyState();
}

function createListItem(id, value, done = false) {
  const element = document.createElement('article');
  element.classList.add('grocery-item');
  element.setAttribute('data-id', id);
  element.setAttribute('data-done', String(done));

  element.innerHTML = `
    <div class="item-main">
      <img class="item-check" src="Resources/Icons/Check-default.svg" width="20" height="20" alt="">
      <p class="item-name">${value}</p>
    </div>
    <div class="btn-container">
      <button type="button" class="edit-btn" aria-label="Editar">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24" height="24" fill="none">
          <path d="M6 24C6 21.7909 7.79086 20 10 20C12.2091 20 14 21.7909 14 24C14 26.2091 12.2091 28 10 28C7.79086 28 6 26.2091 6 24ZM20 24C20 21.7909 21.7909 20 24 20C26.2091 20 28 21.7909 28 24C28 26.2091 26.2091 28 24 28C21.7909 28 20 26.2091 20 24ZM34 24C34 21.7909 35.7909 20 38 20C40.2091 20 42 21.7909 42 24C42 26.2091 40.2091 28 38 28C35.7909 28 34 26.2091 34 24Z"/>
        </svg>
      </button>
    </div>`;

  element.querySelector('.edit-btn').addEventListener('click', editItem);

  // aplica UI conforme o estado salvo
  setItemDoneUI(element, done);

  list.appendChild(element);

  // atualiza empty-state
  toggleEmptyState();
}


  


