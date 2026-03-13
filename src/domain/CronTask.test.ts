import { describe, it, expect } from 'vitest';
import { CronTask } from './CronTask';

describe('CronTask Entity', () => {
  it('deve parsear uma linha cron normal com sucesso', () => {
    const result = CronTask.create('*/15 * * * * /usr/bin/node script.js');
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.task.expression.value).toBe('*/15 * * * *');
      expect(result.task.command).toBe('/usr/bin/node script.js');
      expect(result.task.logRedirection.strategy).toBe('none');
    }
  });

  it('deve parsear uma macro do sistema', () => {
    const result = CronTask.create('@reboot /opt/startup.sh');
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.task.expression.isMacro).toBe(true);
      expect(result.task.expression.value).toBe('@reboot');
      expect(result.task.command).toBe('/opt/startup.sh');
    }
  });

  it('deve extrair a documentação de um comentário na mesma linha', () => {
    const result = CronTask.create('0 0 * * * backup.sh # Faz o backup diário');
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.task.description).toBe('Faz o backup diário');
      expect(result.task.command).toBe('backup.sh');
    }
  });

  it('deve extrair o redirecionamento de logs (Silenciar)', () => {
    const result = CronTask.create('* * * * * ping -c 1 google.com > /dev/null 2>&1');
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.task.command).toBe('ping -c 1 google.com');
      expect(result.task.logRedirection.strategy).toBe('discard');
      expect(result.task.fullCommand).toBe('ping -c 1 google.com > /dev/null 2>&1');
    }
  });

  it('deve identificar uma tarefa pausada (comentada)', () => {
    const result = CronTask.create('# 0 12 * * * /bin/script.sh');
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.task.isPaused).toBe(true);
      expect(result.task.command).toBe('/bin/script.sh');
    }
  });

  it('deve falhar e retornar erro funcional para linhas inválidas', () => {
    const result = CronTask.create('*/15 * * *'); // Falta 1 parte
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Formato de comando inválido');
    }
  });
});