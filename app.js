(function loadStyles(){
    const href = 'styles.css';
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => console.log('styles loaded:', href);
    link.onerror = () => console.warn('Failed to load styles:', href);
    document.head.appendChild(link);
})();

const STORAGE_KEY = 'todo_tasks_v1';

function loadTasks(){
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if(!raw) return [];
        const arr = JSON.parse(raw);
        if(!Array.isArray(arr)) return [];
        return arr;
    } catch(e){
        showModal('loadTasks error', e);
        return [];
    }
}

function saveTasks(tasks){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function uid(){
    return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

function createEl(tag, opts = {}) {
    const el = document.createElement(tag);
    if(opts.className) el.className = opts.className;
    if(opts.text) el.textContent = opts.text;
    if(opts.html) el.innerHTML = opts.html;
    if(opts.attrs) for(const k in opts.attrs) el.setAttribute(k, opts.attrs[k]);
    return el;
}

let tasks = loadTasks();
let filterMode = 'all'; // all | active | done
let sortAsc = true;
let searchQuery = '';

const app = createEl('div', {className:'app'});
const container = createEl('main', {className:'container', attrs:{role:'main'}});
app.appendChild(container);
document.body.appendChild(app);

const header = createEl('header', {className:'header'});
const headerRow = createEl('div', {className:'headerRow'});
const title = createEl('h1', {text:'ToDo List — чистый JS'});
const subtitle = createEl('div', {className:'small', text:'Создавайте, редактируйте, фильтруйте и меняйте порядок задач (drag & drop).'});
headerRow.appendChild(title);
headerRow.appendChild(subtitle);
header.appendChild(headerRow);

const controls = createEl('section', {className:'controls'});
const form = createEl('form', {className:'form', attrs:{'aria-label':'Добавить задачу'}});
const inputText = createEl('input', {className:'input-text', attrs:{type:'text', placeholder:'Название задачи', required:'', 'aria-label':'Название задачи'}});
const inputDate = createEl('input', {className:'input-date', attrs:{type:'date', 'aria-label':'Дата выполнения'}});
const addBtn = createEl('button', {className:'btn', text:'Добавить', attrs:{type:'submit'}});
form.appendChild(inputText);
form.appendChild(inputDate);
form.appendChild(addBtn);

const tools = createEl('div', {className:'tools'});
const search = createEl('input', {className:'search', attrs:{type:'search', placeholder:'Поиск по названию', 'aria-label':'Поиск по названию'}});
const filters = createEl('div', {className:'filters'});
const btnAll = createEl('button', {className:'filter-btn active', text:'Все', attrs:{type:'button'}});
const btnActive = createEl('button', {className:'filter-btn', text:'Невыполненные', attrs:{type:'button'}});
const btnDone = createEl('button', {className:'filter-btn', text:'Выполненные', attrs:{type:'button'}});
filters.appendChild(btnAll);
filters.appendChild(btnActive);
filters.appendChild(btnDone);

const sortBtn = createEl('button', {className:'icon-btn', text:'Сортировать по дате (↑)', attrs:{type:'button'}});
tools.appendChild(search);
tools.appendChild(filters);
tools.appendChild(sortBtn);

controls.appendChild(form);
controls.appendChild(tools);
header.appendChild(controls);

container.appendChild(header);

const listSection = createEl('section', {className:'listSection'});
const list = createEl('ul', {className:'list', attrs:{role:'list'}}); // semantic
listSection.appendChild(list);
container.appendChild(listSection);

const footer = createEl('footer', {className:'small', text:'Tip: перетащите задачу за правую "ручку", чтобы поменять порядок.'});
container.appendChild(footer);

function formatDate(d){
    if(!d) return '';
    const dt = new Date(d);
    if(Number.isNaN(dt.getTime())) return '';
    return dt.toLocaleDateString();
}

function render(){
    let visible = tasks.slice();

    if(searchQuery.trim()){
        const q = searchQuery.trim().toLowerCase();
        visible = visible.filter(t => (t.title||'').toLowerCase().includes(q));
    }

    if(filterMode === 'active') visible = visible.filter(t => !t.done);
    if(filterMode === 'done') visible = visible.filter(t => t.done);

    visible.sort((a,b) => {
        const da = a.due ? new Date(a.due).getTime() : 0;
        const db = b.due ? new Date(b.due).getTime() : 0;
        if(da === db) return 0;
        return sortAsc ? da - db : db - da;
    });

    list.innerHTML = '';
    if(visible.length === 0){
        const empty = createEl('div', {className:'small', text:'Задач пока нет.'});
        list.appendChild(empty);
        return;
    }

    visible.forEach(task => {
        const li = createEl('li', {className:'task-card' + (task.done ? ' completed' : ''), attrs:{draggable:'true', 'data-id':task.id}});
        const left = createEl('div', {className:'task-left'});
        const chk = createEl('div', {className:'checkbox', attrs:{role:'button', 'aria-label':'Отметить как выполненное'}});
        chk.addEventListener('click', ()=> toggleDone(task.id));
        chk.textContent = task.done ? '✓' : '';
        const titleWrap = createEl('div', {style:''});
        const titleEl = createEl('div', {className:'task-title', text:task.title||''});
        const meta = createEl('div', {className:'task-meta', text: task.due ? `Срок: ${formatDate(task.due)}` : 'Без срока'});
        titleWrap.appendChild(titleEl);
        titleWrap.appendChild(meta);
        left.appendChild(chk);
        left.appendChild(titleWrap);

        const actions = createEl('div', {className:'task-actions'});
        const editBtn = createEl('button', {className:'icon-btn', text:'Ред.', attrs:{type:'button','aria-label':'Редактировать'}});
        const delBtn = createEl('button', {className:'icon-btn', text:'Удалить', attrs:{type:'button','aria-label':'Удалить'}});
        const dragHandle = createEl('div', {className:'drag-handle', text:'☰', attrs:{title:'Перетащить'}});
        actions.appendChild(editBtn);
        actions.appendChild(delBtn);
        actions.appendChild(dragHandle);

        li.appendChild(left);
        li.appendChild(actions);

        editBtn.addEventListener('click', ()=> startEdit(task.id, li, titleEl, meta));
        delBtn.addEventListener('click', ()=> removeTask(task.id));

        li.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', task.id);
            li.classList.add('dragging');
            if(e.dataTransfer.setDragImage) {
                const img = document.createElement('canvas');
                img.width = 1; img.height = 1;
                e.dataTransfer.setDragImage(img, 0, 0);
            }
        });
        li.addEventListener('dragend', () => {
            li.classList.remove('dragging');
        });

        li.addEventListener('dragover', (e) => {
            e.preventDefault();
            const dragging = document.querySelector('.dragging');
            if(!dragging) return;
            const over = li;
            over.style.outline = '2px dashed rgba(59,130,246,0.2)';
        });
        li.addEventListener('dragleave', () => {
            li.style.outline = '';
        });
        li.addEventListener('drop', (e) => {
            e.preventDefault();
            li.style.outline = '';
            const draggedId = e.dataTransfer.getData('text/plain');
            if(!draggedId) return;
            reorderTasks(draggedId, task.id);
        });

        list.appendChild(li);
    });
}

function addTask(title, due){
    const t = {
        id: uid(),
        title: title.trim(),
        due: due || '',
        done: false
    };
    tasks.push(t);
    saveTasks(tasks);
    render();
}

function removeTask(id){
    tasks = tasks.filter(t => t.id !== id);
    saveTasks(tasks);
    render();
}

function toggleDone(id){
    const t = tasks.find(x => x.id === id);
    if(!t) return;
    t.done = !t.done;
    saveTasks(tasks);
    render();
}

function startEdit(id, li, titleEl, metaEl){
    if (li.classList.contains('editing')) return;
    li.classList.add('editing');
    const task = tasks.find(t => t.id === id);
    if(!task) return;
    const inputT = createEl('input', {className:'edit-input', attrs:{type:'text'}});
    inputT.value = task.title;
    const inputD = createEl('input', {className:'edit-input', attrs:{type:'date'}});
    inputD.value = task.due ? (new Date(task.due)).toISOString().slice(0,10) : '';
    const saveBtn = createEl('button', {className:'btn', text:'Сохранить', attrs:{type:'button'}});
    const cancelBtn = createEl('button', {className:'icon-btn', text:'Отмена', attrs:{type:'button'}});
    titleEl.style.display = 'none';
    metaEl.style.display = 'none';

    const holder = titleEl.parentElement;
    const controls = createEl('div', {style:'display:flex;gap:6px; margin-left:8px;'});
    controls.appendChild(inputT);
    controls.appendChild(inputD);
    controls.appendChild(saveBtn);
    controls.appendChild(cancelBtn);
    holder.appendChild(controls);

    saveBtn.addEventListener('click', ()=>{
        const newTitle = inputT.value.trim();
        const newDate = inputD.value ? new Date(inputD.value).toISOString() : '';
        if(!newTitle){
            showModal('Введите название задачи');
            return;
        }
        task.title = newTitle;
        task.due = newDate;
        li.classList.remove('editing');
        saveTasks(tasks);
        render();
    });
    cancelBtn.addEventListener('click', ()=>{
        li.classList.remove('editing');
        render();
    });
}

function showModal(message){
    // Создаем overlay
    const overlay = createEl('div', {className:'modal-overlay', attrs:{role:'alertdialog', 'aria-modal':'true'}});
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(0,0,0,0.4)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '1000';

    // Создаем само окно
    const box = createEl('div', {className:'modal-box'});
    box.style.background = 'white';
    box.style.padding = '16px 24px';
    box.style.borderRadius = '12px';
    box.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
    box.style.maxWidth = '90%';
    box.style.textAlign = 'center';

    const text = createEl('div', {text: message});
    text.style.marginBottom = '12px';

    const btn = createEl('button', {text:'OK', className:'btn'});
    btn.addEventListener('click', ()=> document.body.removeChild(overlay));

    box.appendChild(text);
    box.appendChild(btn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
}

function reorderTasks(draggedId, targetId){
    if(draggedId === targetId) return;
    const idxDragged = tasks.findIndex(t => t.id === draggedId);
    const idxTarget = tasks.findIndex(t => t.id === targetId);
    if(idxDragged === -1 || idxTarget === -1) return;
    const [item] = tasks.splice(idxDragged,1);
    const insertIndex = tasks.findIndex(t => t.id === targetId);
    tasks.splice(insertIndex, 0, item);
    saveTasks(tasks);
    render();
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = inputText.value;
    const due = inputDate.value ? new Date(inputDate.value).toISOString() : '';
    if(!title.trim()){
        showModal('Введите название задачи');
        return;
    }
    addTask(title, due);
    form.reset();
    inputText.focus();
});

btnAll.addEventListener('click', ()=>{
    filterMode = 'all';
    btnAll.classList.add('active');
    btnActive.classList.remove('active');
    btnDone.classList.remove('active');
    render();
});
btnActive.addEventListener('click', ()=>{
    filterMode = 'active';
    btnAll.classList.remove('active');
    btnActive.classList.add('active');
    btnDone.classList.remove('active');
    render();
});
btnDone.addEventListener('click', ()=>{
    filterMode = 'done';
    btnAll.classList.remove('active');
    btnActive.classList.remove('active');
    btnDone.classList.add('active');
    render();
});

sortBtn.addEventListener('click', ()=>{
    sortAsc = !sortAsc;
    sortBtn.textContent = `Сортировать по дате (${sortAsc ? '↑' : '↓'})`;
    render();
});

search.addEventListener('input', (e)=>{
    searchQuery = e.target.value;
    render();
});

render();



