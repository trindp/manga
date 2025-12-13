const grid = document.getElementById('mangaGrid');
const modal = document.getElementById('modal');

const titleInput = document.getElementById('titleInput');
const imageInput = document.getElementById('imageInput');
const linkInput = document.getElementById('linkInput');
const descInput = document.getElementById('descInput');

let mangaList = [];
let activeIndex = null;
let dragIndex = null;

function save() {
  localStorage.setItem('mangaList', JSON.stringify(mangaList));
}

function load() {
  const data = localStorage.getItem('mangaList');
  if (data) mangaList = JSON.parse(data);
}

function render() {
  grid.innerHTML = '';

  mangaList.forEach((m, index) => {
    const card = document.createElement('div');
    card.className = 'manga-card';
    card.draggable = true;

    card.innerHTML = `
      <img src="${m.img || 'https://via.placeholder.com/400x600'}">
      <div class="manga-info">
        <div class="manga-title">${m.title}</div>
        <div class="manga-desc">${m.desc}</div>
        ${m.link ? `<a class="open-btn" href="${m.link}" target="_blank">Open</a>` : ''}
      </div>
    `;

    card.onclick = (e) => {
      if (e.target.classList.contains('open-btn')) return;
      openEditor(index);
    };

    card.addEventListener('dragstart', () => {
      dragIndex = index;
      card.classList.add('dragging');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      dragIndex = null;
      save();
    });

    card.addEventListener('dragover', e => e.preventDefault());

    card.addEventListener('drop', () => {
      const temp = mangaList[dragIndex];
      mangaList[dragIndex] = mangaList[index];
      mangaList[index] = temp;
      render();
    });

    grid.appendChild(card);
  });
}

function openEditor(index) {
  activeIndex = index;
  const m = mangaList[index];
  titleInput.value = m.title;
  imageInput.value = m.img;
  linkInput.value = m.link;
  descInput.value = m.desc;
  modal.classList.remove('hidden');
}

function closeEditor() {
  modal.classList.add('hidden');
}

function saveChanges() {
  mangaList[activeIndex] = {
    title: titleInput.value || 'Untitled',
    img: imageInput.value,
    link: linkInput.value,
    desc: descInput.value
  };
  save();
  render();
  closeEditor();
}

document.getElementById('newCardBtn').onclick = () => {
  mangaList.push({
    title: 'New Manga',
    img: '',
    link: '',
    desc: 'Click to edit'
  });
  save();
  render();
};

document.getElementById('saveBtn').onclick = saveChanges;
document.getElementById('closeBtn').onclick = closeEditor;

/* INIT */
load();
if (mangaList.length === 0) {
  mangaList.push({
    title: 'Attack on Titan',
    img: 'https://via.placeholder.com/400x600',
    link: '',
    desc: 'Dark fantasy action'
  });
}
render();
