import { Channel } from '../channel';

export interface ChannelRepository<TMessage> {
    findChannelByTopic(topic: string): Promise<Channel<TMessage>>;
    findAllChannels(): Promise<Channel<TMessage>[]>;
    deleteChannelByTopic(topic: string): Promise<void>;
}
