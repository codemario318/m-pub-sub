export interface ScheduledTask {
    readonly name: string;
    readonly interval: number;

    execute(): Promise<void>;
}