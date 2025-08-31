// ****** SELECT ITEMS *****:
const container = document.querySelector('.grocery-container');
const list = document.querySelector('.grocery-list');
const clearBtn = document.querySelector('.clear-btn');

const groceryAdd = document.getElementById('grocery-add');
const groceryEdit = document.getElementById('grocery-edit');
const submitAddBtn = document.getElementById('submit-add');
const submitEditBtn = document.getElementById('submit-edit');

// edit option
let editElement;
let editFlag = false;
let editID = "";

// ****** EVENT LISTENERS **********
submitAddBtn.addEventListener('click', addItem);
clearBtn.addEventListener('click', ClearItems);

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

// ****** FUNCTIONS **********
function addItem() {
    const value = groceryAdd.value;
    const id = new Date().getTime().toString();
  
    if (value) {
      const element = document.createElement('article');
      element.classList.add('grocery-item');
      element.setAttribute('data-id', id);
      element.setAttribute('data-done', 'false'); // novo
  
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
  
      // add to local storage (agora com done=false)
      addToLocalStorage(id, value, false);
  
      // reset input e fechar modal
      groceryAdd.value = "";
      closeModal('addModal');

      //hide empty-state
      toggleEmptyState();

    }
  }

  document.getElementById('openAddModalBtn')
  .addEventListener('click', () => {
    openModal('addModal');
    const input = document.querySelector('#grocery-add');
    if (input) input.focus(); // vem direto do clique do usuário
  });


// Item of the list toggle on and off
function toggleBox() {
    const box = document.getElementById('box');
    box.classList.toggle('active'); 
  }

  //empty-state
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
  
    modal.style.display = "flex";
    modal.style.alignItems = "flex-end";
    modal.style.zIndex = "1000";
  
    // Garantir foco após o repaint
    requestAnimationFrame(() => {
      const input =
        modal.querySelector("#grocery-add") ||
        modal.querySelector("#grocery-edit");
      if (input) input.focus();
    });
  }
  
  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.style.display = "none";
  }
  
  
  setTimeout(() => input.focus(), 50);


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
}

// confirm edição
submitEditBtn.addEventListener('click', function() {
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

// toggle
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
    element.setAttribute('data-done', String(done)); // novo
  
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

    //hide empty-state
    toggleEmptyState();
  }

  


