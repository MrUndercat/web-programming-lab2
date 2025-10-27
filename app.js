const STORAGE_KEY = 'todo_tasks_v1';

function loadTasks(){
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if(!raw) return [];
        const arr = JSON.parse(raw);
        if(!Array.isArray(arr)) return [];
        return arr;
    } catch(e){
        console.error('loadTasks error', e);
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
