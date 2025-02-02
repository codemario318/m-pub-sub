import { MessageHandler, Unsubscribe } from '../types';

export interface Broker<TMessage> {
    subscribe(publisherId: string, handler: MessageHandler<TMessage>): Promise<Unsubscribe>;
    publish(publisherId: string, message: TMessage): Promise<void>;
}