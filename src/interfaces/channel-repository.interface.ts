import { Channel } from '../channel';

export interface ChannelRepository {
    findChannelByTopic<TMessage>(topic: string): Promise<Channel<TMessage>>;
    findAllChannels<TMessage>(): Promise<Channel<TMessage>[]>;
    deleteChannelByTopic(topic: string): Promise<void>;
}
