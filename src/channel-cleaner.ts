import { ChannelRepository } from './interfaces';
import { Channel } from './channel';
import { clearInterval } from 'node:timers';

const CLEANUP_INTERVAL_DEFAULT = 3600;
const STALE_THRESHOLD = 1800;

export interface ChannelCleanerOption {
    cleanupInterval?: number;
    staleThreshold?: number;
}

export class ChannelCleaner {
    private timer?: NodeJS.Timeout;
    private isRunning = false;

    private readonly cleanupInterval: number;
    private readonly staleThreshold: number;

    constructor(
        private readonly repository: ChannelRepository,
        options?: ChannelCleanerOption,
    ) {
        this.cleanupInterval =
            options?.cleanupInterval ?? CLEANUP_INTERVAL_DEFAULT;
        this.staleThreshold = options?.staleThreshold ?? STALE_THRESHOLD;
    }

    public execute() {
        this.timer = setInterval(
            () => this.cleanupChannels(),
            this.cleanupInterval,
        );
    }

    public stop() {
        if (this.timer !== undefined) {
            clearInterval(this.timer);
            this.timer = undefined;
        }
    }

    private async cleanupChannels() {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;

        const channels = await this.repository.findAllChannels();

        await Promise.allSettled(
            channels.map((channel) => this.cleanupChannel(channel)),
        );

        this.isRunning = false;
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
