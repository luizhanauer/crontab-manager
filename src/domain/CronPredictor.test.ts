import { describe, it, expect } from 'vitest';
import { CronTask } from './CronTask';
import { CronPredictor } from './CronPredictor';

describe('CronPredictor Service', () => {
  it('deve prever a próxima execução de hora em hora', () => {
    const taskResult = CronTask.create("0 * * * * script.sh");
    if (!taskResult.success) throw new Error("Falha no setup");

    const executions = CronPredictor.getNextExecutions([taskResult.task], 24);
    
    // 24 execuções em 24 horas
    expect(executions.length).toBe(24);
    
    // Todas as execuções devem ocorrer cravadas no minuto 0
    const allOnMinuteZero = executions.every(e => e.date.getMinutes() === 0);
    expect(allOnMinuteZero).toBe(true);
  });

  it('deve ignorar tarefas pausadas no cálculo de insights', () => {
    const taskResult = CronTask.create("# 0 * * * * script.sh");
    if (!taskResult.success) throw new Error("Falha no setup");

    const executions = CronPredictor.getNextExecutions([taskResult.task], 24);
    expect(executions.length).toBe(0);
  });

  it('deve gerar o heatmap cobrindo exatamente 24 blocos de hora', () => {
    const taskResult = CronTask.create("0 * * * * script.sh");
    if (!taskResult.success) throw new Error("Falha no setup");

    const heatmap = CronPredictor.generateHeatmap([taskResult.task]);
    
    expect(heatmap.length).toBe(24);
    
    // Deve haver 1 execução em cada slot de hora do heatmap
    const allHaveOneRun = heatmap.every(slot => slot.count === 1);
    expect(allHaveOneRun).toBe(true);
  });

  it('deve agregar múltiplas tarefas no mesmo slot do heatmap', () => {
    const t1 = CronTask.create("0 3 * * * script1.sh");
    const t2 = CronTask.create("15 3 * * * script2.sh");
    if (!t1.success || !t2.success) throw new Error("Falha no setup");

    const heatmap = CronPredictor.generateHeatmap([t1.task, t2.task]);
    
    // O slot das 3 da manhã deve ter 2 execuções contabilizadas
    const slot3AM = heatmap.find(h => h.hour === 3);
    expect(slot3AM?.count).toBe(2);
  });
});