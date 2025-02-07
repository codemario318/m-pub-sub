import { MessageHandler, Unsubscribe } from '../types';

export interface Subscription<TMessage> {
    readonly id: string;
    readonly handler: MessageHandler<TMessage>;
    unsubscribe: Unsubscribe;
}
