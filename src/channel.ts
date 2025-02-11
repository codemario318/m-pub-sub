import { Cleanable, Subjection, Subscription } from './interfaces';
import { MessageHandler } from './types';
import { randomUUID } from 'node:crypto';

export class Channel<TMessage> implements Subjection<TMessage>, Cleanable {
    constructor(
        readonly topic: string,
        private subscriptions: Subscription<TMessage>[] = [],
        private _lastUpdatedAt: Date = new Date(),
    ) {}

    public async publish(message: TMessage): Promise<void> {
        this._lastUpdatedAt = new Date();
        void Promise.all(
            this.subscriptions.map((subscription) =>
                subscription.handler(message).catch((reason) => {
                    console.error(reason);
                }),
            ),
        );
    }

    public async subscribe(handler: MessageHandler<TMessage>) {
        const id = randomUUID();
        const subscription = {
            id,
            handler,
            unsubscribe: () => this.unsubscribe(id),
        };

        this.subscriptions.push(subscription);
        this._lastUpdatedAt = new Date();

        return subscription;
    }

    private async unsubscribe(subscriptionId: string) {
        this.subscriptions = this.subscriptions.filter(
            (subscription) => subscription.id !== subscriptionId,
        );
    }

    get lastUpdatedAt() {
        return this._lastUpdatedAt;
    }

    get subscriberLength() {
        return this.subscriptions.length;
    }
}
