import { Cleanable } from './cleanable.interface';

export interface CleanableChannelRepository {
    findAllChannels(): Promise<Cleanable[]>;
    deleteChannelByTopic(topic: string): Promise<void>;
}
