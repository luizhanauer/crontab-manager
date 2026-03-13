<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { CronTask, CronExpression, CRON_MACROS, LogRedirection, type LogStrategy } from '../domain/CronTask';
import { CronHumanizer } from '../domain/CronHumanizer';
import { CronValidator } from '../domain/CronValidator';

const props = defineProps<{ isOpen: boolean; task: CronTask | null; }>();
const emit = defineEmits<{ (e: 'close'): void; (e: 'save', updatedTask: CronTask): void; }>();

const isMacroMode = ref(false);
const selectedMacro = ref('@daily');

const partMin = ref('*'); const partHour = ref('*'); const partDom = ref('*');
const partMon = ref('*'); const partDow = ref('*');
const command = ref(''); const description = ref('');
const errorMsg = ref('');

const logStrategy = ref<LogStrategy>('none');
const logPath = ref('');

const resetForm = (taskToLoad: CronTask | null): void => {
  errorMsg.value = '';
  const isNew = taskToLoad === null;
  
  if (isNew) {
    isMacroMode.value = false;
    partMin.value = '*'; partHour.value = '*'; partDom.value = '*';
    partMon.value = '*'; partDow.value = '*';
    command.value = ''; description.value = '';
    logStrategy.value = 'none'; logPath.value = '';
    return;
  }
  
  isMacroMode.value = taskToLoad.expression.isMacro;
  if (isMacroMode.value) selectedMacro.value = taskToLoad.expression.value;
  
  const isNormalCron = !isMacroMode.value;
  if (isNormalCron) {
    const parts = taskToLoad.expression.parts;
    partMin.value = parts[0]; partHour.value = parts[1];
    partDom.value = parts[2]; partMon.value = parts[3]; partDow.value = parts[4];
  }
  
  command.value = taskToLoad.command;
  description.value = taskToLoad.description;
  logStrategy.value = taskToLoad.logRedirection.strategy;
  logPath.value = taskToLoad.logRedirection.path;
};

watch(() => props.isOpen, (newVal) => { if (newVal) resetForm(props.task); });

const currentExpressionString = computed(() => {
  if (isMacroMode.value) return selectedMacro.value;
  return `${partMin.value} ${partHour.value} ${partDom.value} ${partMon.value} ${partDow.value}`;
});

const liveTranslation = computed(() => {
  const expr = CronExpression.create(currentExpressionString.value);
  if (expr === null) return "⚠ Expressão inválida.";
  return CronHumanizer.translate(expr);
});

const handleSave = (): void => {
  const isNormalCron = !isMacroMode.value;
  if (isNormalCron) {
    const err = CronValidator.validateFields(partMin.value, partHour.value, partDom.value, partMon.value, partDow.value);
    if (err) { errorMsg.value = err; return; }
  }

  const baseTask = props.task === null ? CronTask.createDefault() : props.task;
  const redirection = LogRedirection.create(logStrategy.value, logPath.value);
  
  const result = baseTask.update(currentExpressionString.value, command.value, description.value, redirection);
  
  if (!result.success) { errorMsg.value = result.error; return; }
  
  emit('save', result.task);
  emit('close');
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-neon-surface border border-neon-accent shadow-neon rounded-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh] overflow-y-auto">
      
      <header class="bg-[#0f1419] border-b border-neon-border p-5 flex justify-between items-center sticky top-0 z-10">
        <h3 class="font-bold text-white text-xl flex items-center gap-3">
          <span class="text-neon-accent">{{ task ? '✏' : '＋' }}</span> {{ task ? 'Editar Tarefa' : 'Nova Tarefa' }}
        </h3>
        <button @click="emit('close')" class="text-slate-500 hover:text-white transition-colors cursor-pointer text-2xl leading-none">&times;</button>
      </header>

      <div class="p-6 flex flex-col gap-6">
        <div class="bg-neon-success/10 border border-neon-success/30 p-4 rounded-xl flex flex-col gap-2">
          <span class="text-[10px] text-neon-success uppercase tracking-widest font-bold">Tradução em Tempo Real</span>
          <p class="text-neon-success font-mono text-sm">> {{ liveTranslation }}</p>
        </div>

        <div>
          <div class="flex justify-between items-center mb-3">
            <label class="text-[11px] text-slate-400 font-bold uppercase tracking-widest">1. Quando executar?</label>
            <label class="flex items-center gap-2 cursor-pointer text-xs text-neon-accent">
              <input type="checkbox" v-model="isMacroMode" class="accent-neon-accent" /> Usar Macro
            </label>
          </div>

          <div v-if="isMacroMode" class="bg-[#0b0f19] p-4 rounded-xl border border-neon-border">
            <select v-model="selectedMacro" class="w-full bg-transparent text-white font-mono focus:outline-none">
              <option v-for="m in CRON_MACROS" :key="m" :value="m" class="bg-neon-surface">{{ m }}</option>
            </select>
          </div>

          <div v-if="!isMacroMode" class="grid grid-cols-5 gap-3">
            <div class="flex flex-col gap-1.5"><span class="text-[10px] text-center text-slate-500">Min (0-59)</span><input v-model="partMin" type="text" class="w-full bg-[#0b0f19] border border-neon-border rounded-xl p-3 text-center text-sm font-mono text-white focus:border-neon-accent focus:outline-none transition-colors" /></div>
            <div class="flex flex-col gap-1.5"><span class="text-[10px] text-center text-slate-500">Hora (0-23)</span><input v-model="partHour" type="text" class="w-full bg-[#0b0f19] border border-neon-border rounded-xl p-3 text-center text-sm font-mono text-white focus:border-neon-accent focus:outline-none transition-colors" /></div>
            <div class="flex flex-col gap-1.5"><span class="text-[10px] text-center text-slate-500">Dia (1-31)</span><input v-model="partDom" type="text" class="w-full bg-[#0b0f19] border border-neon-border rounded-xl p-3 text-center text-sm font-mono text-white focus:border-neon-accent focus:outline-none transition-colors" /></div>
            <div class="flex flex-col gap-1.5"><span class="text-[10px] text-center text-slate-500">Mês (1-12)</span><input v-model="partMon" type="text" class="w-full bg-[#0b0f19] border border-neon-border rounded-xl p-3 text-center text-sm font-mono text-white focus:border-neon-accent focus:outline-none transition-colors" /></div>
            <div class="flex flex-col gap-1.5"><span class="text-[10px] text-center text-slate-500">Sem. (0-7)</span><input v-model="partDow" type="text" class="w-full bg-[#0b0f19] border border-neon-border rounded-xl p-3 text-center text-sm font-mono text-white focus:border-neon-accent focus:outline-none transition-colors" /></div>
          </div>
        </div>

        <div class="flex flex-col gap-5">
          <div><label class="text-[11px] text-slate-400 font-bold mb-2 block uppercase tracking-widest">2. O que executar?</label><input v-model="command" type="text" class="w-full bg-[#0b0f19] border border-neon-border rounded-xl p-3 text-sm font-mono text-white focus:border-neon-accent focus:outline-none transition-colors shadow-inner" placeholder="/usr/bin/script.sh" /></div>
          <div><label class="text-[11px] text-slate-400 font-bold mb-2 block uppercase tracking-widest">3. Documentação (Opcional)</label><input v-model="description" type="text" class="w-full bg-[#0b0f19] border border-neon-border rounded-xl p-3 text-sm text-white focus:border-neon-accent focus:outline-none transition-colors shadow-inner" placeholder="Ex: Limpeza diária" /></div>
        </div>

        <div class="bg-[#111827] border border-neon-border p-5 rounded-xl flex flex-col gap-4">
           <label class="text-[11px] text-slate-400 font-bold block uppercase tracking-widest">4. Assistente de Logs (Redirecionamento)</label>
           
           <div class="grid grid-cols-2 gap-3">
             <label class="flex items-center gap-3 text-sm p-3 rounded-xl border cursor-pointer transition-all" :class="{ 'bg-neon-accent/10 border-neon-accent text-white shadow-[0_0_10px_rgba(14,165,233,0.3)]': logStrategy === 'none', 'bg-[#0b0f19] border-neon-border text-slate-400 hover:border-neon-accent/50 hover:text-white': logStrategy !== 'none' }">
               <input type="radio" v-model="logStrategy" value="none" class="hidden" />
               <div class="w-4 h-4 rounded-full border flex items-center justify-center transition-colors" :class="{'border-neon-accent': logStrategy === 'none', 'border-slate-500': logStrategy !== 'none'}">
                 <div v-if="logStrategy === 'none'" class="w-2 h-2 rounded-full bg-neon-accent shadow-[0_0_5px_rgba(14,165,233,1)]"></div>
               </div>
               <span class="font-bold">Padrão</span>
             </label>

             <label class="flex items-center gap-3 text-sm p-3 rounded-xl border cursor-pointer transition-all" :class="{ 'bg-neon-accent/10 border-neon-accent text-white shadow-[0_0_10px_rgba(14,165,233,0.3)]': logStrategy === 'discard', 'bg-[#0b0f19] border-neon-border text-slate-400 hover:border-neon-accent/50 hover:text-white': logStrategy !== 'discard' }">
               <input type="radio" v-model="logStrategy" value="discard" class="hidden" />
               <div class="w-4 h-4 rounded-full border flex items-center justify-center transition-colors" :class="{'border-neon-accent': logStrategy === 'discard', 'border-slate-500': logStrategy !== 'discard'}">
                 <div v-if="logStrategy === 'discard'" class="w-2 h-2 rounded-full bg-neon-accent shadow-[0_0_5px_rgba(14,165,233,1)]"></div>
               </div>
               <div class="flex flex-col">
                 <span class="font-bold">Silenciar</span>
                 <span class="text-[10px] font-mono opacity-70">> /dev/null</span>
               </div>
             </label>

             <label class="flex items-center gap-3 text-sm p-3 rounded-xl border cursor-pointer transition-all" :class="{ 'bg-neon-accent/10 border-neon-accent text-white shadow-[0_0_10px_rgba(14,165,233,0.3)]': logStrategy === 'append', 'bg-[#0b0f19] border-neon-border text-slate-400 hover:border-neon-accent/50 hover:text-white': logStrategy !== 'append' }">
               <input type="radio" v-model="logStrategy" value="append" class="hidden" />
               <div class="w-4 h-4 rounded-full border flex items-center justify-center transition-colors" :class="{'border-neon-accent': logStrategy === 'append', 'border-slate-500': logStrategy !== 'append'}">
                 <div v-if="logStrategy === 'append'" class="w-2 h-2 rounded-full bg-neon-accent shadow-[0_0_5px_rgba(14,165,233,1)]"></div>
               </div>
               <div class="flex flex-col">
                 <span class="font-bold">Salvar Tudo</span>
                 <span class="text-[10px] font-mono opacity-70">>> arquivo.log</span>
               </div>
             </label>

             <label class="flex items-center gap-3 text-sm p-3 rounded-xl border cursor-pointer transition-all" :class="{ 'bg-neon-accent/10 border-neon-accent text-white shadow-[0_0_10px_rgba(14,165,233,0.3)]': logStrategy === 'error_only', 'bg-[#0b0f19] border-neon-border text-slate-400 hover:border-neon-accent/50 hover:text-white': logStrategy !== 'error_only' }">
               <input type="radio" v-model="logStrategy" value="error_only" class="hidden" />
               <div class="w-4 h-4 rounded-full border flex items-center justify-center transition-colors" :class="{'border-neon-accent': logStrategy === 'error_only', 'border-slate-500': logStrategy !== 'error_only'}">
                 <div v-if="logStrategy === 'error_only'" class="w-2 h-2 rounded-full bg-neon-accent shadow-[0_0_5px_rgba(14,165,233,1)]"></div>
               </div>
               <div class="flex flex-col">
                 <span class="font-bold">Apenas Erros</span>
                 <span class="text-[10px] font-mono opacity-70">2> erro.log</span>
               </div>
             </label>
           </div>

           <div v-if="logStrategy === 'append' || logStrategy === 'error_only'" class="mt-2">
              <input v-model="logPath" type="text" class="w-full bg-[#0b0f19] border border-neon-border rounded-xl p-3 text-sm font-mono text-white focus:border-neon-accent focus:outline-none transition-colors" placeholder="/var/log/meu-script.log" />
           </div>
        </div>

        <div v-if="errorMsg" class="text-xs text-neon-error font-bold p-3 bg-neon-error/10 border border-neon-error/30 rounded-xl">⚠ {{ errorMsg }}</div>
      </div>

      <footer class="bg-[#0f1419] border-t border-neon-border p-5 flex justify-end gap-4 sticky bottom-0 z-10">
        <button @click="emit('close')" class="px-4 py-2 text-sm text-slate-400 hover:text-white font-bold cursor-pointer transition-colors">Cancelar</button>
        <button @click="handleSave" class="bg-neon-accent text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-neon hover:bg-sky-400 cursor-pointer transition-colors">Salvar Tarefa</button>
      </footer>

    </div>
  </div>
</template>