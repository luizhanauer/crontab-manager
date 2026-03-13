import type { CronExpression } from "./CronTask";

const MACRO_TRANSLATIONS: Record<string, string> = {
  "@reboot": "na inicialização do sistema",
  "@yearly": "uma vez por ano (1 de Janeiro)",
  "@annually": "uma vez por ano (1 de Janeiro)",
  "@monthly": "uma vez por mês (no dia 1)",
  "@weekly": "uma vez por semana (aos Domingos)",
  "@daily": "uma vez por dia (à meia-noite)",
  "@midnight": "uma vez por dia (à meia-noite)",
  "@hourly": "uma vez por hora (no minuto 0)"
};

const mapDayOfWeek = (token: string): string => {
  const days: Record<string, string> = {
    "0": "Dom", "1": "Seg", "2": "Ter", "3": "Qua", "4": "Qui", "5": "Sex", "6": "Sáb", "7": "Dom"
  };
  return days[token] || token;
};

const humanizePart = (part: string, singular: string, plural: string, prefixo: string = "em", todoStr: string = "todo"): string => {
  if (part === "*") return `${todoStr} ${singular}`;
  
  if (part.startsWith("*/")) return `a cada ${part.replace("*/", "")} ${plural}`;
  
  if (part.includes("-")) {
    const [start, end] = part.split("-");
    return `${prefixo} ${singular}s ${start} até ${end}`;
  }
  
  if (part.includes(",")) return `${prefixo} ${plural} ${part.split(",").join(" e ")}`;
  
  return `${prefixo} ${singular} ${part}`;
};

const humanizeDow = (raw: string): string => {
  if (raw === "*") return "qualquer dia da semana";
  
  if (raw.includes(",")) {
    return `quando for ` + raw.split(",").map(mapDayOfWeek).join(" e ");
  }
  
  if (raw.includes("-")) {
    const [start, end] = raw.split("-");
    return `de ${mapDayOfWeek(start)} a ${mapDayOfWeek(end)}`;
  }
  
  if (raw.startsWith("*/")) return `a cada ${raw.replace("*/", "")} dias da semana`;
  
  return `quando for ${mapDayOfWeek(raw)}`;
};

export class CronHumanizer {
  public static translate(expression: CronExpression): string {
    if (expression.isMacro) return `Executa ${MACRO_TRANSLATIONS[expression.value]}`;

    const parts = expression.value.split(/\s+/);
    const minute = humanizePart(parts[0], "minuto", "minutos", "no", "todo");
    const hour = humanizePart(parts[1], "hora", "horas", "na", "toda");
    const dayOfMonth = humanizePart(parts[2], "dia do mês", "dias do mês", "no", "todo");
    const month = humanizePart(parts[3], "mês", "meses", "no", "todo");
    const dayOfWeek = humanizeDow(parts[4]);

    return `Executa ${minute}, ${hour}, ${dayOfMonth}, ${month}, ${dayOfWeek}.`;
  }
}