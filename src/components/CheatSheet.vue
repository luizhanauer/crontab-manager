<script setup lang="ts">
import { ref } from 'vue';

const copiedId = ref<string | null>(null);

const terminalCommands = [
  { id: 'edit', cmd: 'crontab -e', desc: '# Editar arquivo cron' },
  { id: 'list', cmd: 'crontab -l', desc: '# Listar tarefas atuais' },
  { id: 'remove', cmd: 'crontab -r', desc: '# Apagar TODO o crontab (Cuidado)' },
  { id: 'status', cmd: 'systemctl status cron', desc: '# Checar serviço' }
];

const copyCommand = async (command: string, id: string): Promise<void> => {
  await navigator.clipboard.writeText(command);
  copiedId.value = id;
  
  setTimeout(() => {
    const isStillCurrent = copiedId.value === id;
    if (isStillCurrent) copiedId.value = null;
  }, 2000);
};
</script>

<template>
  <div class="bg-neon-surface border border-neon-border rounded-2xl shadow-lg overflow-hidden flex flex-col">
    <header class="bg-[#0b0f19] border-b border-neon-border p-4">
      <h3 class="font-bold text-white flex items-center gap-2">
        <span class="text-neon-accent">📖</span> Guia Rápido & Comandos
      </h3>
    </header>
    
    <div class="p-5 flex flex-col gap-6">
      
      <div class="flex flex-col gap-3">
        <span class="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Comandos de Terminal</span>
        <div class="flex flex-col gap-3">
          
          <div 
            v-for="item in terminalCommands" 
            :key="item.id"
            class="bg-[#0b0f19] p-3 rounded-xl border border-neon-border flex flex-col gap-2 group hover:border-neon-accent/50 transition-colors"
          >
            <div class="flex justify-between items-start">
              <code class="text-sm font-mono text-neon-accent">{{ item.cmd }}</code>
              
              <button 
                @click="copyCommand(item.cmd, item.id)"
                class="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded transition-all cursor-pointer"
                :class="copiedId === item.id ? 'bg-neon-success text-white shadow-[0_0_8px_theme(colors.green.500)]' : 'bg-neon-surface text-slate-400 hover:text-white border border-neon-border hover:border-neon-accent'"
              >
                <span v-if="copiedId === item.id">✓ Copiado</span>
                <span v-if="copiedId !== item.id">Copiar</span>
              </button>
            </div>
            <span class="text-xs text-slate-500 font-mono">{{ item.desc }}</span>
          </div>

        </div>
      </div>

      <div class="flex flex-col gap-3">
        <span class="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Macros Suportadas</span>
        <ul class="flex flex-col gap-2 text-sm text-slate-300">
          <li class="flex justify-between border-b border-neon-border/50 pb-2"><span class="font-mono text-neon-accent">@reboot</span> <span class="text-xs text-slate-400">Na inicialização</span></li>
          <li class="flex justify-between border-b border-neon-border/50 pb-2"><span class="font-mono text-neon-accent">@daily</span> <span class="text-xs text-slate-400">Todo dia à meia-noite</span></li>
          <li class="flex justify-between border-b border-neon-border/50 pb-2"><span class="font-mono text-neon-accent">@hourly</span> <span class="text-xs text-slate-400">A cada hora cheia</span></li>
          <li class="flex justify-between"><span class="font-mono text-neon-accent">@weekly</span> <span class="text-xs text-slate-400">Domingos à meia-noite</span></li>
        </ul>
      </div>
    </div>
  </div>
</template>