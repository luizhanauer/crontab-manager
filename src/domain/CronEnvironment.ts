export type EnvParseResult = 
  | { success: true; env: CronEnvironment }
  | { success: false };

export class CronEnvironment {
  public readonly id: string;
  public readonly key: string;
  public readonly value: string;

  private constructor(id: string, key: string, value: string) {
    this.id = id;
    this.key = key;
    this.value = value;
  }

  public static create(rawLine: string): EnvParseResult {
    const trimmed = rawLine.trim();
    
    const isCommentOrEmpty = trimmed.startsWith("#") || trimmed.length === 0;
    if (isCommentOrEmpty) return { success: false };

    const isValidEnvPattern = /^[A-Za-z_][A-Za-z0-9_]*=.*$/.test(trimmed);
    if (!isValidEnvPattern) return { success: false };

    const splitIndex = trimmed.indexOf("=");
    const key = trimmed.substring(0, splitIndex).trim();
    const value = trimmed.substring(splitIndex + 1).trim();

    return { 
      success: true, 
      env: new CronEnvironment(crypto.randomUUID(), key, value) 
    };
  }

  public static createNew(key: string, value: string): CronEnvironment {
    return new CronEnvironment(crypto.randomUUID(), key.trim(), value.trim());
  }

  public toString(): string {
    return `${this.key}=${this.value}`;
  }
}