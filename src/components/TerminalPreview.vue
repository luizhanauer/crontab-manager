<script setup lang="ts">
import { ref, computed } from 'vue';
import { CronTask } from '../domain/CronTask';
import { CronEnvironment } from '../domain/CronEnvironment';

const props = defineProps<{ tasks: CronTask[], envs: CronEnvironment[] }>();

const isCopied = ref(false);
const isDownloaded = ref(false);

const finalCrontab = computed(() => {
  const lines: string[] = [];
  lines.push("# ==========================================");
  lines.push("# Arquivo gerado via Crontab Manager");
  lines.push("# ==========================================\n");

  if (props.envs.length > 0) {
    for (const env of props.envs) lines.push(env.toString());
    lines.push(""); // Linha em branco separadora
  }

  for (const task of props.tasks) {
    const hasDescription = task.description.trim().length > 0;
    if (hasDescription) lines.push(`# ${task.description}`);
    
    const prefix = task.isPaused ? "# " : "";
    lines.push(`${prefix}${task.expression.value} ${task.fullCommand}\n`);
  }

  if (props.tasks.length === 0 && props.envs.length === 0) {
    lines.push("# O seu crontab está limpo.");
  }

  return lines.join('\n');
});

const copyToClipboard = async (): Promise<void> => {
  await navigator.clipboard.writeText(finalCrontab.value);
  isCopied.value = true;
  setTimeout(() => isCopied.value = false, 2000);
};

const downloadFile = (): void => {
  const blob = new Blob([finalCrontab.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'crontab.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  isDownloaded.value = true;
  setTimeout(() => isDownloaded.value = false, 2000);
};
</script>

<template>
  <div class="flex flex-col gap-2 w-full">
    <span class="text-[11px] text-slate-400 uppercase tracking-widest font-bold ml-2">Pré-visualização final</span>
    
    <div class="bg-[#0f1419] rounded-2xl border border-neon-border shadow-2xl overflow-hidden flex flex-col w-full">
      <header class="bg-[#1a212d] px-4 py-3 flex items-center justify-between border-b border-neon-border flex-wrap gap-3">
        <div class="flex gap-2 items-center">
          <div class="flex gap-2 mr-2">
            <div class="w-3 h-3 rounded-full bg-neon-error"></div>
            <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div class="w-3 h-3 rounded-full bg-neon-success"></div>
          </div>
          <span class="text-xs text-slate-400 font-mono hidden sm:block">unk@desktop:~</span>
        </div>

        <div class="flex gap-2">
          <button @click="copyToClipboard" class="text-xs font-bold px-4 py-1.5 rounded-lg transition-all flex items-center" :class="isCopied ? 'bg-neon-success text-white shadow-[0_0_10px_theme(colors.green.500)]' : 'bg-neon-surface border border-neon-border text-neon-accent hover:bg-neon-accent hover:text-white'">
            {{ isCopied ? '✓ Copiado!' : '📋 Copiar' }}
          </button>
          <button @click="downloadFile" class="text-xs font-bold px-4 py-1.5 rounded-lg transition-all flex items-center" :class="isDownloaded ? 'bg-sky-400 text-white shadow-[0_0_10px_theme(colors.sky.400)]' : 'bg-[#0b0f19] border border-neon-border text-slate-300 hover:bg-slate-700 hover:text-white'">
            {{ isDownloaded ? '✓ Baixado!' : '⬇ Baixar .txt' }}
          </button>
        </div>
      </header>

      <div class="p-5 overflow-x-auto">
        <pre class="font-mono text-sm text-slate-300 leading-relaxed whitespace-pre-wrap word-break"><code>{{ finalCrontab }}</code></pre>
      </div>
    </div>
  </div>
</template>

<style scoped>.word-break { word-break: break-all; }</style>