<script setup lang="ts">
import { ref, computed } from 'vue';
import { CronExpression } from '../domain/CronTask';
import { CronHumanizer } from '../domain/CronHumanizer';

const quickInput = ref('');

const quickTranslation = computed(() => {
  if (quickInput.value.trim() === '') return "Digite uma expressão para decifrar...";
  const expr = CronExpression.create(quickInput.value);
  if (expr === null) return "Expressão inválida ou incompleta.";
  return CronHumanizer.translate(expr);
});
</script>

<template>
  <div class="bg-neon-surface border border-neon-border rounded-2xl p-6 shadow-lg flex flex-col gap-4">
    <div class="flex flex-col gap-1">
      <span class="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Decodificador Rápido</span>
      <h2 class="text-lg font-bold text-white">Desvende qualquer cron</h2>
    </div>
    
    <input 
      v-model="quickInput" 
      type="text" 
      class="w-full bg-[#0b0f19] border border-neon-border rounded-xl p-3 text-sm font-mono focus:border-neon-accent focus:ring-1 focus:ring-neon-accent focus:outline-none transition-all text-white shadow-inner" 
      placeholder="Ex: */15 * * * 1-5" 
    />
    
    <p class="text-neon-success text-sm flex items-center gap-2 font-medium bg-neon-success/10 px-4 py-3 rounded-xl border border-neon-success/20">
      <span class="text-lg">↻</span> {{ quickTranslation }}
    </p>
  </div>
</template>