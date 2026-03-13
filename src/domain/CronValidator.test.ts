import { describe, it, expect } from 'vitest';
import { CronValidator } from './CronValidator';

describe('CronValidator Service', () => {
  it('deve aceitar campos no limite máximo permitido', () => {
    const error = CronValidator.validateFields("59", "23", "31", "12", "7");
    expect(error).toBeNull();
  });

  it('deve aceitar campos no limite mínimo permitido', () => {
    const error = CronValidator.validateFields("0", "0", "1", "1", "0");
    expect(error).toBeNull();
  });

  it('deve rejeitar minutos fora do limite', () => {
    const error = CronValidator.validateFields("60", "*", "*", "*", "*");
    expect(error).toBe("Minutos devem estar entre 0 e 59.");
  });

  it('deve processar listas de números validando cada um', () => {
    const validError = CronValidator.validateFields("1,15,30", "*", "*", "*", "*");
    expect(validError).toBeNull();

    const invalidError = CronValidator.validateFields("1,15,65", "*", "*", "*", "*");
    expect(invalidError).toBe("Minutos devem estar entre 0 e 59.");
  });

  it('deve rejeitar horas inválidas em ranges', () => {
    const error = CronValidator.validateFields("*", "18-25", "*", "*", "*");
    expect(error).toBe("Horas devem estar entre 0 e 23.");
  });
});