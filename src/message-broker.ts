import { MessageHandler } from './types';
import { ChannelCleaner } from './channel-cleaner';
import { ChannelRepository } from './interfaces';

export class MessageBroker<TMessage> {
    constructor(
        private readonly repository: ChannelRepository,
        private readonly cleaner: ChannelCleaner,
    ) {
        this.cleaner.execute();
    }

    public async subscribe(topic: string, handler: MessageHandler<TMessage>) {
        const channel = await this.repository.findChannelByTopic(topic);
        const subscribe = await channel.subscribe(handler);
        return subscribe.unsubscribe;
    }

    public async publish(topic: string, message: TMessage) {
        const channel = await this.repository.findChannelByTopic(topic);
        return channel.publish(message);
    }
}
