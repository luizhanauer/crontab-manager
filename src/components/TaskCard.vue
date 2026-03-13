<script setup lang="ts">
import { CronTask } from '../domain/CronTask';

defineProps<{ task: CronTask }>();
const emit = defineEmits<{
  (e: 'edit', task: CronTask): void;
  (e: 'delete', taskId: string): void;
  (e: 'togglePause', taskId: string): void;
}>();
</script>

<template>
  <div 
    class="bg-neon-surface border rounded-2xl p-6 flex flex-col gap-5 transition-all shadow-lg relative group cursor-grab active:cursor-grabbing"
    :class="task.isPaused ? 'border-dashed border-slate-600 opacity-60 grayscale-[50%]' : 'border-neon-border hover:border-neon-accent shadow-neon-hover'"
  >
    <div class="flex justify-between items-start">
      <div class="flex flex-col gap-1">
        <span class="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Descrição da Tarefa</span>
        <div class="flex items-center gap-3">
          <span class="text-slate-600 cursor-grab px-1 hover:text-white transition-colors" title="Arraste">⋮⋮</span>
          <h3 class="text-xl font-bold text-white tracking-wide flex items-center gap-3">
            {{ task.description || 'Tarefa sem descrição' }}
            <span v-if="task.isPaused" class="text-[10px] bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-2 py-1 rounded-md tracking-widest">PAUSADA</span>
          </h3>
        </div>
      </div>
      
      <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button @click.stop="emit('togglePause', task.id)" class="text-xs bg-slate-800 text-slate-300 border border-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-all cursor-pointer">
          {{ task.isPaused ? '▶ Retomar' : '⏸ Pausar' }}
        </button>
        <button @click.stop="emit('edit', task)" class="text-xs bg-neon-accent/10 text-neon-accent border border-neon-accent/30 px-3 py-1.5 rounded-lg hover:bg-neon-accent hover:text-white transition-all cursor-pointer shadow-neon">Editar</button>
        <button @click.stop="emit('delete', task.id)" class="text-xs bg-neon-error/10 text-neon-error border border-neon-error/30 px-3 py-1.5 rounded-lg hover:bg-neon-error hover:text-white transition-all cursor-pointer">Remover</button>
      </div>
    </div>
    
    <div class="flex flex-col gap-4 ml-7 mt-1">
      <div class="flex flex-col gap-1">
        <span class="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Expressão Cron</span>
        <div class="inline-block bg-[#0b0f19] border border-neon-border text-neon-accent font-bold px-4 py-2 rounded-xl text-lg tracking-widest shadow-inner w-fit">
          {{ task.expression.value }}
        </div>
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Tradução Humanizada</span>
        <p class="text-neon-success text-sm flex items-center gap-2 font-medium bg-neon-success/10 px-4 py-2 rounded-xl border border-neon-success/20 w-fit">
          <span class="text-lg">↻</span> {{ task.humanize() }}
        </p>
      </div>
    </div>

    <div class="flex flex-col gap-1 ml-7 mt-2">
      <span class="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Comando Executado (Com Logs)</span>
      <code class="text-sm bg-[#0b0f19] p-4 rounded-xl text-slate-300 overflow-x-auto border border-neon-border shadow-inner font-mono">
        <span class="text-neon-accent mr-2">$</span>{{ task.fullCommand }}
      </code>
    </div>
  </div>
</template>