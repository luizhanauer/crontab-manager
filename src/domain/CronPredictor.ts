import { CronTask } from "./CronTask";

export interface ExecutionTick {
  date: Date;
  task: CronTask;
}

export class CronPredictor {
  private static matchPart(cronPart: string, dateValue: number): boolean {
    if (cronPart === "*") return true;

    if (cronPart.startsWith("*/")) {
      const step = parseInt(cronPart.replace("*/", ""), 10);
      return dateValue % step === 0;
    }

    if (cronPart.includes("-")) {
      const [start, end] = cronPart.split("-").map(Number);
      return dateValue >= start && dateValue <= end;
    }

    if (cronPart.includes(",")) {
      const values = cronPart.split(",").map(Number);
      return values.includes(dateValue);
    }

    return parseInt(cronPart, 10) === dateValue;
  }

  private static isMatch(task: CronTask, date: Date): boolean {
    // Macros simplificadas para o heatmap de 24h
    if (task.expression.isMacro) {
      const macro = task.expression.value;
      if (macro === "@hourly") return date.getMinutes() === 0;
      if (macro === "@daily" || macro === "@midnight") return date.getHours() === 0 && date.getMinutes() === 0;
      return false; // Ignora @reboot, @yearly no heatmap de 24h
    }

    const parts = task.expression.parts;
    const isMinuteMatch = this.matchPart(parts[0], date.getMinutes());
    const isHourMatch = this.matchPart(parts[1], date.getHours());
    const isDomMatch = this.matchPart(parts[2], date.getDate());
    const isMonthMatch = this.matchPart(parts[3], date.getMonth() + 1);
    const isDowMatch = this.matchPart(parts[4], date.getDay());

    return isMinuteMatch && isHourMatch && isDomMatch && isMonthMatch && isDowMatch;
  }

  public static getNextExecutions(tasks: CronTask[], hoursAhead: number = 24): ExecutionTick[] {
    const activeTasks = tasks.filter(t => !t.isPaused);
    const now = new Date();
    // Zera os segundos para cálculo exato de cron
    now.setSeconds(0, 0);

    const executions: ExecutionTick[] = [];
    const totalMinutes = hoursAhead * 60;

    // Força bruta funcional: avança minuto a minuto e checa
    for (let i = 0; i < totalMinutes; i++) {
      const cursorDate = new Date(now.getTime() + i * 60000);
      
      const matchedTasks = activeTasks.filter(task => this.isMatch(task, cursorDate));
      
      const mappedExecutions = matchedTasks.map(task => ({
        date: new Date(cursorDate.getTime()), // Clone da data
        task
      }));
      
      executions.push(...mappedExecutions);
    }

    return executions;
  }

  public static generateHeatmap(tasks: CronTask[]): { hour: number; count: number }[] {
    const executions = this.getNextExecutions(tasks, 24);
    
    // Inicializa um array de 24 posições (0 a 23)
    const heatmap = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));

    for (const exec of executions) {
      const h = exec.date.getHours();
      heatmap[h].count += 1;
    }

    return heatmap;
  }
}