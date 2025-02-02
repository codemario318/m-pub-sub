import { Broker } from './interfaces';
import { MessageHandler } from './types';
import { randomUUID } from 'node:crypto';
import { Subscription } from './interfaces';

export class MessageBroker<TMessage> implements Broker<TMessage> {
    constructor(
        private readonly channels: Map<string, Subscription<TMessage>[]> = new Map(),
    ) {}

    public async subscribe(channel: string, handler: MessageHandler<TMessage>) {
        const subscriptions = this.getSubscriptions(channel)
        const subscriptionId = randomUUID();

        this.channels.set(channel, [...subscriptions, {id: subscriptionId, handler}]);

        return () => this.unsubscribe(channel, subscriptionId);
    }

    public async publish(channel: string, message: TMessage) {
        const subscriptions = this.getSubscriptions(channel);
        await Promise.all(subscriptions.map((subscriber) => subscriber.handler(message)));
    }

    private getSubscriptions(channel: string) {
        if (!this.channels.has(channel)) {
            this.channels.set(channel, []);
        }

        return this.channels.get(channel)!;
    }

    private async unsubscribe(channel: string, subscriptionId: string) {
        const subscriptions = this.getSubscriptions(channel);
        this.channels.set(channel, subscriptions.filter((subscription) => subscription.id !== subscriptionId));
    }
}