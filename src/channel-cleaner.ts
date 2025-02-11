import {
    Cleanable,
    CleanableChannelRepository,
    ScheduledTask,
} from './interfaces';

const CLEANUP_INTERVAL_DEFAULT = 3600;
const STALE_THRESHOLD = 1800;

export interface ChannelCleanerOption {
    interval?: number;
    staleThreshold?: number;
}

export class ChannelCleaner implements ScheduledTask {
    readonly name: string = 'Cleaner';
    readonly interval: number;
    private readonly staleThreshold: number;

    constructor(
        private readonly repository: CleanableChannelRepository,
        options?: ChannelCleanerOption,
    ) {
        this.interval = options?.interval ?? CLEANUP_INTERVAL_DEFAULT;
        this.staleThreshold = options?.staleThreshold ?? STALE_THRESHOLD;
    }

    public async execute() {
        const channels = await this.repository.findAllChannels();

        await Promise.allSettled(
            channels.map((channel) => this.cleanupChannel(channel)),
        );
    }

    private async cleanupChannel(channel: Cleanable) {
        if (this.isExpiredChannel(channel)) {
            await this.repository.deleteChannelByTopic(channel.topic);
        }
    }

    private isExpiredChannel(channel: Cleanable) {
        const threshold = Date.now() - this.staleThreshold;
        return (
            channel.subscriberLength === 0 &&
            channel.lastUpdatedAt.getTime() < threshold
        );
    }
}
