export interface Cleanable {
    readonly topic: string;
    readonly lastUpdatedAt: Date;
    readonly subscriberLength: number;
}