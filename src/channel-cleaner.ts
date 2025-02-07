import { ChannelRepository } from './interfaces';
import { Channel } from './channel';

const CLEANUP_INTERVAL_DEFAULT = 3600;
const STALE_THRESHOLD = 1800;

export interface ChannelCleanerOption {
    interval?: number;
    staleThreshold?: number;
}

export class ChannelCleaner {
    readonly interval: number;
    private readonly staleThreshold: number;

    constructor(
        private readonly repository: ChannelRepository,
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

    private async cleanupChannel(channel: Channel<any>) {
        if (this.isExpiredChannel(channel)) {
            await this.repository.deleteChannelByTopic(channel.topic);
        }
    }

    private isExpiredChannel(channel: Channel<any>) {
        const threshold = Date.now() - this.staleThreshold;
        return (
            channel.subscriberLength === 0 &&
            channel.lastUpdatedAt.getTime() < threshold
        );
    }
}
