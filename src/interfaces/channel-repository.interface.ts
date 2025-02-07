import { Channel } from '../channel';

export interface ChannelRepository {
    findChannelByTopic(topic: string): Promise<Channel<any>>;
    findAllChannels(): Promise<Channel<any>[]>;
    deleteChannelByTopic(topic: string): Promise<void>;
}
