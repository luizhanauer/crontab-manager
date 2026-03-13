import { describe, it, expect } from 'vitest';
import { CronEnvironment } from './CronEnvironment';

describe('CronEnvironment Entity', () => {
  it('deve extrair uma variável de ambiente válida', () => {
    const result = CronEnvironment.create('PATH=/usr/local/bin:/usr/bin');
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.env.key).toBe('PATH');
      expect(result.env.value).toBe('/usr/local/bin:/usr/bin');
    }
  });

  it('deve falhar para comentários comuns', () => {
    const result = CronEnvironment.create('# PATH=/bin');
    expect(result.success).toBe(false);
  });

  it('deve formatar corretamente para string no crontab', () => {
    const env = CronEnvironment.createNew('MAILTO', 'admin@meudominio.com');
    expect(env.toString()).toBe('MAILTO=admin@meudominio.com');
  });
});