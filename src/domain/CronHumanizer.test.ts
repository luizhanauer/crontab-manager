import { describe, it, expect } from 'vitest';
import { CronExpression } from './CronTask';
import { CronHumanizer } from './CronHumanizer';

describe('CronHumanizer Service', () => {
  it('deve traduzir uma expressão de asteriscos puros', () => {
    const expr = CronExpression.create('* * * * *')!;
    const texto = CronHumanizer.translate(expr);
    expect(texto).toContain('todo minuto');
    expect(texto).toContain('toda hora');
  });

  it('deve traduzir steps (divisores)', () => {
    const expr = CronExpression.create('*/15 * * * *')!;
    const texto = CronHumanizer.translate(expr);
    expect(texto).toContain('a cada 15 minutos');
  });

  it('deve mapear corretamente os dias da semana (ranges)', () => {
    const expr = CronExpression.create('0 0 * * 1-5')!;
    const texto = CronHumanizer.translate(expr);
    expect(texto).toContain('de Seg a Sex');
  });

  it('deve traduzir macros nativas', () => {
    const expr = CronExpression.create('@reboot')!;
    const texto = CronHumanizer.translate(expr);
    expect(texto).toBe('Executa na inicialização do sistema');
  });
});