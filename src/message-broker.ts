import { MessageHandler } from './types';
import { ChannelCleaner } from './channel-cleaner';
import { ChannelRepository } from './interfaces';
import { Scheduler } from './scheduler';
import { MemoryChannelRepository } from './memory-channel-repository';
import { ScheduledTask } from './interfaces';

export class MessageBroker<TMessage> {
    constructor(
        private readonly repository: ChannelRepository<TMessage> = new MemoryChannelRepository(),
        private readonly scheduler: Scheduler = new Scheduler(),
        private readonly tasks: ScheduledTask[] = [
            new ChannelCleaner(repository),
        ],
    ) {
        this.initializeScheduler();
    }

    private initializeScheduler() {
        this.tasks.forEach((task) => this.scheduler.registerTask(task));
        this.scheduler.startAll();
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
