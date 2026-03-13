<script setup lang="ts">
import { ref } from 'vue';
import { CronTask } from './domain/CronTask';
import { CronEnvironment } from './domain/CronEnvironment';
import TaskCard from './components/TaskCard.vue';
import TaskModal from './components/TaskModal.vue';
import TerminalPreview from './components/TerminalPreview.vue';
import QuickTranslator from './components/QuickTranslator.vue';
import CheatSheet from './components/CheatSheet.vue';
import EnvManager from './components/EnvManager.vue';
import InsightsModal from './components/InsightsModal.vue';

const rawInput = ref<string>('');
const parsedTasks = ref<CronTask[]>([]);
const parsedEnvs = ref<CronEnvironment[]>([]);
const parseErrors = ref<string[]>([]);

const isModalOpen = ref(false);
const taskBeingEdited = ref<CronTask | null>(null);
const isInsightsOpen = ref(false);

const draggedIndex = ref<number | null>(null);

const processCrontab = (): void => {
  parsedTasks.value = [];
  parsedEnvs.value = [];
  parseErrors.value = [];
  
  const lines = rawInput.value.split('\n');
  let currentComment = '';

  for (const line of lines) {
    const trimmed = line.trim();
    
    const envResult = CronEnvironment.create(trimmed);
    if (envResult.success) {
      parsedEnvs.value.push(envResult.env);
      continue;
    }

    const isSimpleComment = trimmed.startsWith('#') && !trimmed.substring(1).trim().match(/^(@[a-z]+|[0-9*/,-]+)/);
    if (isSimpleComment) {
      currentComment = trimmed.substring(1).trim();
      continue;
    }

    const result = CronTask.create(trimmed, currentComment);
    if (result.success) {
      parsedTasks.value.push(result.task);
      currentComment = ''; 
      continue;
    } 
    
    const isIgnored = result.error === "Linha de comentário ignorada" || result.error === "Linha vazia ignorada";
    if (!isIgnored) {
      parseErrors.value.push(`Linha "${trimmed}": ${result.error}`);
    }
  }
};

const handleEnvAdd = (env: CronEnvironment): void => {
  parsedEnvs.value.push(env);
};

const handleEnvRemove = (id: string): void => {
  parsedEnvs.value = parsedEnvs.value.filter(e => e.id !== id);
};

const openNewTaskModal = (): void => { 
  taskBeingEdited.value = null; 
  isModalOpen.value = true; 
};

const openEditModal = (task: CronTask): void => { 
  taskBeingEdited.value = task; 
  isModalOpen.value = true; 
};

const handleModalSave = (savedTask: CronTask): void => {
  const isNew = taskBeingEdited.value === null;
  if (isNew) { 
    parsedTasks.value.push(savedTask); 
    return; 
  }
  
  const index = parsedTasks.value.findIndex(t => t.id === savedTask.id);
  const isFound = index !== -1;
  if (isFound) {
    parsedTasks.value[index] = savedTask;
  }
};

const deleteTask = (id: string): void => { 
  parsedTasks.value = parsedTasks.value.filter(t => t.id !== id); 
};

const togglePauseTask = (id: string): void => {
  const index = parsedTasks.value.findIndex(t => t.id === id);
  const isFound = index !== -1;
  if (isFound) {
    parsedTasks.value[index] = parsedTasks.value[index].togglePause();
  }
};

const onDragStart = (index: number): void => { 
  draggedIndex.value = index; 
};

const onDrop = (dropIndex: number): void => {
  const isInvalidDrop = draggedIndex.value === null || draggedIndex.value === dropIndex;
  if (isInvalidDrop) return;

  const tasksClone = [...parsedTasks.value];
  const [draggedItem] = tasksClone.splice(draggedIndex.value!, 1);
  tasksClone.splice(dropIndex, 0, draggedItem);
  
  parsedTasks.value = tasksClone;
  draggedIndex.value = null;
};
</script>

<template>
  <main class="max-w-7xl mx-auto flex flex-col gap-10 pb-12 pt-8">
    
    <header class="flex flex-col gap-2 border-b border-neon-border pb-6 px-4 xl:px-0">
      <h1 class="text-4xl font-extrabold text-white flex items-center gap-3">
        <span class="text-neon-accent drop-shadow-[0_0_8px_rgba(14,165,233,0.8)]">⚡</span> Crontab Manager
      </h1>
      <p class="text-slate-400 text-lg">Decodifique, gerencie e orquestre tarefas do sistema de forma visual e intuitiva.</p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 px-4 xl:px-0">
      
      <aside class="flex flex-col gap-6 lg:sticky lg:top-8 h-fit">
        <QuickTranslator />
        <CheatSheet />
      </aside>

      <div class="flex flex-col gap-8">
        
        <section class="flex flex-col gap-3 bg-neon-surface p-6 rounded-2xl border border-neon-border shadow-lg">
          <div class="flex flex-col gap-1">
             <h2 class="text-lg font-bold text-white">Importação em Massa</h2>
             <p class="text-sm text-slate-500 mb-2">Cole o seu crontab atual abaixo para processar e gerar os cartões e variáveis de ambiente.</p>
          </div>
          <textarea 
            v-model="rawInput" 
            rows="4" 
            class="bg-[#0b0f19] border border-neon-border rounded-xl p-4 text-sm focus:outline-none focus:border-neon-accent w-full resize-y font-mono text-white shadow-inner transition-colors" 
            placeholder="# Cole aqui..."
          ></textarea>
          <div class="flex justify-end mt-2">
            <button @click="processCrontab" class="bg-neon-accent text-white px-6 py-3 rounded-xl font-bold hover:bg-sky-400 shadow-neon transition-colors cursor-pointer">
              Processar Tarefas
            </button>
          </div>
        </section>

        <section v-if="parseErrors.length > 0" class="bg-neon-error/10 border border-neon-error/30 rounded-2xl p-6 shadow-lg">
          <h2 class="text-neon-error font-bold mb-3 flex items-center gap-2 text-lg">⚠ Linhas Ignoradas ou com Erro</h2>
          <ul class="flex flex-col gap-2 text-sm text-neon-error/90 font-mono w-full">
            <li v-for="(err, index) in parseErrors" :key="index" class="bg-black/30 p-3 rounded-lg border border-neon-error/20 break-all overflow-hidden">
              {{ err }}
            </li>
          </ul>
        </section>

        <EnvManager :envs="parsedEnvs" @add="handleEnvAdd" @remove="handleEnvRemove" />

        <section class="flex flex-col gap-5">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 class="font-bold text-2xl text-white">Tarefas Processadas</h2>
            
            <div class="flex gap-3 w-full sm:w-auto">
              <button 
                @click="isInsightsOpen = true" 
                class="flex-1 sm:flex-none bg-[#0b0f19] border border-slate-600 text-slate-300 px-5 py-2.5 rounded-xl hover:border-white hover:text-white transition-all font-bold shadow-neon cursor-pointer flex items-center justify-center gap-2"
              >
                📊 Cron Insights
              </button>
              
              <button 
                @click="openNewTaskModal" 
                class="flex-1 sm:flex-none bg-[#0b0f19] border border-neon-accent text-neon-accent px-5 py-2.5 rounded-xl hover:bg-neon-accent hover:text-white transition-all font-bold shadow-neon cursor-pointer flex items-center justify-center gap-2"
              >
                + Nova Tarefa
              </button>
            </div>
          </div>
          
          <div v-if="parsedTasks.length === 0" class="flex flex-col items-center justify-center p-12 border-2 border-dashed border-neon-border rounded-2xl bg-neon-surface/50 text-slate-500">
            <span class="text-4xl mb-3">📭</span>
            <p>Nenhuma tarefa no momento. Importe ou crie uma nova.</p>
          </div>
          
          <div v-if="parsedTasks.length > 0" class="flex flex-col gap-5">
            <div 
              v-for="(task, index) in parsedTasks" 
              :key="task.id" 
              draggable="true" 
              @dragstart="onDragStart(index)" 
              @dragover.prevent 
              @drop="onDrop(index)" 
              class="transition-transform"
              :class="{ 'opacity-40 scale-95': draggedIndex === index }"
            >
              <TaskCard 
                :task="task" 
                @edit="openEditModal" 
                @delete="deleteTask" 
                @togglePause="togglePauseTask" 
              />
            </div>
          </div>
        </section>

        <TerminalPreview :tasks="parsedTasks" :envs="parsedEnvs" />

      </div>
    </div>
    
    <TaskModal :isOpen="isModalOpen" :task="taskBeingEdited" @close="isModalOpen = false" @save="handleModalSave" />
    <InsightsModal :isOpen="isInsightsOpen" :tasks="parsedTasks" @close="isInsightsOpen = false" />
    
  </main>
</template>