<script setup lang="ts">
import { ref, watch } from 'vue';
import { CronTask } from '../domain/CronTask';
import { CronPredictor, type ExecutionTick } from '../domain/CronPredictor';

const props = defineProps<{ isOpen: boolean; tasks: CronTask[] }>();
const emit = defineEmits<{ (e: 'close'): void }>();

const viewMode = ref<'heatmap' | 'timeline'>('heatmap');
const heatmapData = ref<{ hour: number; count: number }[]>([]);
const upcomingExecutions = ref<ExecutionTick[]>([]);

watch(() => props.isOpen, (newVal) => {
  const isOpening = newVal === true;
  if (!isOpening) return;
  
  heatmapData.value = CronPredictor.generateHeatmap(props.tasks);
  upcomingExecutions.value = CronPredictor.getNextExecutions(props.tasks, 24).slice(0, 50);
});

const getIntensityClass = (count: number): string => {
  if (count === 0) return 'bg-[#0b0f19] border-neon-border text-slate-600';
  if (count < 5) return 'bg-neon-accent/20 border-neon-accent text-neon-accent shadow-[0_0_10px_rgba(14,165,233,0.3)]';
  if (count < 15) return 'bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]';
  return 'bg-neon-error/30 border-neon-error text-neon-error shadow-[0_0_15px_rgba(239,68,68,0.5)] font-bold';
};

const formatHour = (h: number) => h.toString().padStart(2, '0') + 'h';
const formatTime = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const formatDate = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-neon-surface border border-neon-accent shadow-neon rounded-2xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[90vh]">
      
      <header class="bg-[#0f1419] border-b border-neon-border p-5 flex justify-between items-center">
        <h3 class="font-bold text-white text-xl flex items-center gap-3">
          <span class="text-neon-accent">📊</span> Cron Insights (Próximas 24h)
        </h3>
        <button @click="emit('close')" class="text-slate-500 hover:text-white transition-colors cursor-pointer text-2xl leading-none">&times;</button>
      </header>

      <div class="p-6 flex flex-col gap-6 overflow-y-auto">
        
        <div class="flex bg-[#0b0f19] p-1 rounded-xl border border-neon-border w-fit mx-auto">
          <button @click="viewMode = 'heatmap'" class="px-6 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer" :class="viewMode === 'heatmap' ? 'bg-neon-surface text-neon-accent shadow-inner border border-neon-accent/50' : 'text-slate-500 hover:text-white'">Mapa de Densidade</button>
          <button @click="viewMode = 'timeline'" class="px-6 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer" :class="viewMode === 'timeline' ? 'bg-neon-surface text-neon-accent shadow-inner border border-neon-accent/50' : 'text-slate-500 hover:text-white'">Linha do Tempo</button>
        </div>

        <div v-if="viewMode === 'heatmap'" class="flex flex-col gap-4">
          <div class="bg-neon-surface/50 p-4 rounded-xl border border-neon-border text-sm text-slate-400">
            <strong class="text-white">Identificação de Gargalos:</strong> Cada bloco representa 1 hora do dia. A cor indica o volume de disparos agendados. Blocos <span class="text-neon-error">vermelhos</span> indicam risco de sobrecarga de CPU.
          </div>
          
          <div class="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-3">
            <div 
              v-for="block in heatmapData" 
              :key="block.hour"
              class="flex flex-col items-center justify-center p-3 rounded-xl border transition-all"
              :class="getIntensityClass(block.count)"
            >
              <span class="text-xs font-mono opacity-80">{{ formatHour(block.hour) }}</span>
              <span class="text-lg">{{ block.count }}</span>
              <span class="text-[9px] uppercase tracking-widest opacity-60">Runs</span>
            </div>
          </div>
        </div>

        <div v-if="viewMode === 'timeline'" class="flex flex-col gap-4">
          <div class="bg-neon-surface/50 p-4 rounded-xl border border-neon-border text-sm text-slate-400 flex justify-between items-center">
             <span>Mostrando os próximos <strong>{{ upcomingExecutions.length }}</strong> disparos confirmados.</span>
          </div>

          <div v-if="upcomingExecutions.length === 0" class="text-center p-10 border border-dashed border-neon-border rounded-xl text-slate-500">
            Nenhuma tarefa ativa configurada para as próximas 24 horas.
          </div>

          <div class="flex flex-col gap-2">
            <div v-for="(exec, index) in upcomingExecutions" :key="index" class="flex gap-4 items-center bg-[#0b0f19] p-3 rounded-xl border border-neon-border hover:border-neon-accent/50 transition-colors">
              <div class="flex flex-col items-end min-w-[100px] border-r border-slate-700 pr-4">
                <span class="text-neon-accent font-mono font-bold">{{ formatTime(exec.date) }}</span>
                <span class="text-[10px] text-slate-500 font-mono">{{ formatDate(exec.date) }}</span>
              </div>
              <div class="flex flex-col overflow-hidden">
                <span class="text-white font-bold text-sm truncate">{{ exec.task.description || 'Tarefa sem nome' }}</span>
                <code class="text-[11px] text-slate-400 font-mono truncate">{{ exec.task.fullCommand }}</code>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>