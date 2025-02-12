import { Subscription } from './subscription.interface';
import { MessageHandler } from '../types';

export interface Subjection<TMessage> {
    publish(message: TMessage): Promise<void>;
    subscribe(
        handler: MessageHandler<TMessage>,
    ): Promise<Subscription<TMessage>>;
}
