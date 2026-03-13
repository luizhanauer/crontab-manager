export class CronValidator {
  private static isValidNumberPart(value: string, min: number, max: number): boolean {
    if (value === "*") return true;
    
    // Simplificação funcional para validação de limites (sem regex complexo)
    const numbers = value.match(/\d+/g);
    if (!numbers) return false;
    
    const allWithinLimits = numbers.every(n => {
      const num = parseInt(n, 10);
      return num >= min && num <= max;
    });
    
    return allWithinLimits;
  }

  public static validateFields(min: string, hour: string, dom: string, mon: string, dow: string): string | null {
    if (!this.isValidNumberPart(min, 0, 59)) return "Minutos devem estar entre 0 e 59.";
    if (!this.isValidNumberPart(hour, 0, 23)) return "Horas devem estar entre 0 e 23.";
    if (!this.isValidNumberPart(dom, 1, 31)) return "Dia do mês deve estar entre 1 e 31.";
    if (!this.isValidNumberPart(mon, 1, 12)) return "Mês deve estar entre 1 e 12.";
    if (!this.isValidNumberPart(dow, 0, 7)) return "Dia da semana deve estar entre 0 e 7 (0 e 7 são Domingo).";
    
    return null; // Null significa sem erros
  }
}