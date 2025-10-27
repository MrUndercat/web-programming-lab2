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

let tasks = loadTasks();
