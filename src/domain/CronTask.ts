import { CronHumanizer } from "./CronHumanizer";

export type ParseResult = { success: true; task: CronTask } | { success: false; error: string };

export const CRON_MACROS = ["@reboot", "@yearly", "@annually", "@monthly", "@weekly", "@daily", "@midnight", "@hourly"];

export type LogStrategy = "none" | "discard" | "append" | "error_only";

export class LogRedirection {
  public readonly strategy: LogStrategy;
  public readonly path: string;

  private constructor(strategy: LogStrategy, path: string) {
    this.strategy = strategy;
    this.path = path;
  }

  public static create(strategy: LogStrategy, path: string = ""): LogRedirection {
    return new LogRedirection(strategy, path);
  }

  public static extract(rawCommand: string): { pureCommand: string, redirection: LogRedirection } {
    const discardPattern = />\s*\/dev\/null\s+2>&1$/;
    if (discardPattern.test(rawCommand)) {
      return { pureCommand: rawCommand.replace(discardPattern, "").trim(), redirection: new LogRedirection("discard", "") };
    }

    const appendPattern = />>\s*(\S+)\s*2>&1$/;
    const appendMatch = rawCommand.match(appendPattern);
    if (appendMatch) {
      return { pureCommand: rawCommand.replace(appendPattern, "").trim(), redirection: new LogRedirection("append", appendMatch[1]) };
    }

    const errorPattern = /2>\s*(\S+)$/;
    const errorMatch = rawCommand.match(errorPattern);
    if (errorMatch) {
      return { pureCommand: rawCommand.replace(errorPattern, "").trim(), redirection: new LogRedirection("error_only", errorMatch[1]) };
    }

    return { pureCommand: rawCommand.trim(), redirection: new LogRedirection("none", "") };
  }

  public applyTo(baseCommand: string): string {
    if (this.strategy === "discard") return `${baseCommand} > /dev/null 2>&1`;
    if (this.strategy === "append") return `${baseCommand} >> ${this.path} 2>&1`;
    if (this.strategy === "error_only") return `${baseCommand} 2> ${this.path}`;
    return baseCommand;
  }
}

export class CronExpression {
  public readonly value: string;
  public readonly isMacro: boolean;

  private constructor(value: string, isMacro: boolean) {
    this.value = value;
    this.isMacro = isMacro;
  }

  public static create(value: string): CronExpression | null {
    const trimmed = value.trim().toLowerCase();
    
    const isMacro = CRON_MACROS.includes(trimmed);
    if (isMacro) return new CronExpression(trimmed, true);

    const parts = trimmed.split(/\s+/);
    const isValidLength = parts.length >= 5;
    if (!isValidLength) return null;
    
    return new CronExpression(parts.slice(0, 5).join(" "), false);
  }

  public get parts(): string[] {
    if (this.isMacro) return [this.value, "*", "*", "*", "*"];
    return this.value.split(/\s+/);
  }
}

export class CronTask {
  public readonly id: string;
  public readonly expression: CronExpression;
  public readonly command: string;
  public readonly description: string;
  public readonly isPaused: boolean;
  public readonly logRedirection: LogRedirection;

  private constructor(
    id: string,
    expression: CronExpression,
    command: string,
    description: string,
    isPaused: boolean,
    logRedirection: LogRedirection
  ) {
    this.id = id;
    this.expression = expression;
    this.command = command;
    this.description = description;
    this.isPaused = isPaused;
    this.logRedirection = logRedirection;
  }

  public static create(rawLine: string, previousComment: string = ""): ParseResult {
    let trimmed = rawLine.trim();
    let isPaused = false;
    let localDescription = previousComment;

    const isComment = trimmed.startsWith("#");
    if (isComment) {
      const uncommented = trimmed.substring(1).trim();
      const firstToken = uncommented.split(/\s+/)[0];
      const isCronToken = CRON_MACROS.includes(firstToken?.toLowerCase()) || /^[0-9*/,-]+$/.test(firstToken);
      
      if (!isCronToken) return { success: false, error: "Linha de comentário ignorada" };
      
      isPaused = true;
      trimmed = uncommented;
      localDescription = ""; 
    }

    if (trimmed.length === 0) return { success: false, error: "Linha vazia ignorada" };

    const parts = trimmed.split(/\s+/);
    const firstPart = parts[0].toLowerCase();
    const isMacro = CRON_MACROS.includes(firstPart);
    const minPartsRequired = isMacro ? 2 : 6;
    
    if (parts.length < minPartsRequired) return { success: false, error: "Formato de comando inválido" };

    const rawExp = isMacro ? firstPart : parts.slice(0, 5).join(" ");
    const expression = CronExpression.create(rawExp);
    if (expression === null) return { success: false, error: "Expressão cron inválida" };

    const commandPartsStartIndex = isMacro ? 1 : 5;
    const fullCommandPart = parts.slice(commandPartsStartIndex).join(" ");
    const [commandWithLogs, ...inlineCommentParts] = fullCommandPart.split("#");
    
    const finalDescription = localDescription || inlineCommentParts.join("#").trim() || "";
    
    const { pureCommand, redirection } = LogRedirection.extract(commandWithLogs.trim());
    
    return {
      success: true,
      task: new CronTask(crypto.randomUUID(), expression, pureCommand, finalDescription, isPaused, redirection)
    };
  }

  public static createDefault(): CronTask {
    return new CronTask(crypto.randomUUID(), CronExpression.create("* * * * *")!, "", "", false, LogRedirection.create("none"));
  }

  public update(newExpression: string, newCommand: string, newDescription: string, logRedirection: LogRedirection): ParseResult {
    const expression = CronExpression.create(newExpression);
    if (expression === null) return { success: false, error: "Expressão cron inválida" };

    return {
      success: true,
      task: new CronTask(this.id, expression, newCommand.trim(), newDescription.trim(), this.isPaused, logRedirection)
    };
  }

  public togglePause(): CronTask {
    return new CronTask(this.id, this.expression, this.command, this.description, !this.isPaused, this.logRedirection);
  }

  public get fullCommand(): string {
    return this.logRedirection.applyTo(this.command);
  }

  public humanize(): string {
    return CronHumanizer.translate(this.expression);
  }
}