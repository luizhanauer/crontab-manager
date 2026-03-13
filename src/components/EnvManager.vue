<script setup lang="ts">
import { ref } from 'vue';
import { CronEnvironment } from '../domain/CronEnvironment';

const props = defineProps<{ envs: CronEnvironment[] }>();
const emit = defineEmits<{
  (e: 'add', env: CronEnvironment): void;
  (e: 'remove', id: string): void;
}>();

const newKey = ref('');
const newValue = ref('');

const addEnv = () => {
  const isValid = newKey.value.trim() !== '' && newValue.value.trim() !== '';
  if (!isValid) return;

  const env = CronEnvironment.createNew(newKey.value, newValue.value);
  emit('add', env);
  
  newKey.value = '';
  newValue.value = '';
};
</script>

<template>
  <div class="bg-neon-surface border border-neon-border rounded-2xl p-6 shadow-lg flex flex-col gap-4">
    <div class="flex flex-col gap-1">
      <span class="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Configuração Global</span>
      <h2 class="text-lg font-bold text-white flex items-center gap-2">Variáveis de Ambiente</h2>
    </div>

    <div v-if="envs.length > 0" class="flex flex-col gap-2 mb-2">
      <div v-for="env in envs" :key="env.id" class="flex justify-between items-center bg-[#0b0f19] px-4 py-2 rounded-xl border border-neon-border group">
        <code class="text-sm font-mono text-neon-accent"><span class="text-white">{{ env.key }}</span>={{ env.value }}</code>
        <button @click="emit('remove', env.id)" class="text-neon-error text-xs opacity-0 group-hover:opacity-100 transition-opacity font-bold">Remover</button>
      </div>
    </div>

    <div class="flex gap-2 items-center">
      <input v-model="newKey" type="text" placeholder="KEY (ex: PATH)" class="w-1/3 bg-[#0b0f19] border border-neon-border rounded-xl p-2 text-sm font-mono text-white focus:border-neon-accent focus:outline-none uppercase" />
      <span class="text-slate-500 font-mono">=</span>
      <input v-model="newValue" @keyup.enter="addEnv" type="text" placeholder="Value (ex: /bin:/usr/bin)" class="w-full bg-[#0b0f19] border border-neon-border rounded-xl p-2 text-sm font-mono text-white focus:border-neon-accent focus:outline-none" />
      <button @click="addEnv" class="bg-neon-accent text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-sky-400 transition-colors shadow-neon">+</button>
    </div>
  </div>
</template>