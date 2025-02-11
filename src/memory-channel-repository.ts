import { ChannelRepository } from './interfaces';
import { Channel } from './channel';

export class MemoryChannelRepository<TMessage>
    implements ChannelRepository<TMessage>
{
    constructor(
        private readonly channels: Map<string, Channel<TMessage>> = new Map(),
    ) {}

    public async findChannelByTopic(topic: string) {
        if (!this.channels.has(topic)) {
            this.channels.set(topic, new Channel(topic));
        }

        return this.channels.get(topic)!;
    }

    public async findAllChannels() {
        return [...this.channels.values()];
    }

    public async deleteChannelByTopic(topic: string) {
        this.channels.delete(topic);
    }
}
