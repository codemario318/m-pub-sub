import { Broker } from './interfaces';
import { MessageHandler } from './types';
import { randomUUID } from 'node:crypto';
import { Subscription } from './interfaces';

export class MessageBroker<TMessage> implements Broker<TMessage> {
    constructor(
        private readonly publishers: Map<string, Subscription<TMessage>[]> = new Map(),
    ) {}

    public async addPublisher(id: string) {
        if (this.publishers.has(id)) {
            throw new Error(`Publisher with ID ${id} already exists`);
        }

        this.publishers.set(id, []);
    }

    public async removePublisher(id: string) {
        if (!this.publishers.has(id)) {
            throw new Error(`Publisher with ID ${id} does not exist`);
        }

        this.publishers.delete(id);
    }

    public async publish(id: string, message: TMessage) {
        const subscriptions = this.publishers.get(id);

        if (subscriptions === undefined) {
            throw new Error(`Publisher with ID ${id} does not exist`);
        }

        await Promise.all(subscriptions.map((subscriber) => subscriber.handler(message)));
    }

    public async subscribe(publisherId: string, handler: MessageHandler<TMessage>) {
        const subscriptions = this.publishers.get(publisherId);

        if (subscriptions === undefined) {
            throw new Error(`Publisher with ID ${publisherId} does not exist`);
        }

        const subscriptionId = randomUUID();
        this.publishers.set(publisherId, [...subscriptions, {id: subscriptionId, handler}]);

        return () => this.unsubscribe(publisherId, subscriptionId);
    }

    private async unsubscribe(publisherId: string, subscriptionId: string) {
        const subscriptions = this.publishers.get(publisherId);

        if (subscriptions === undefined) {
            throw new Error(`Publisher with ID ${publisherId} does not exist`);
        }

        this.publishers.set(publisherId, subscriptions.filter((subscription) => subscription.id !== subscriptionId));
    }
}