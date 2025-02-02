import { MessageHandler, Unsubscribe } from '../types';

export interface Broker<TMessage> {
    subscribe(publisherId: string, handler: MessageHandler<TMessage>): Promise<Unsubscribe>;

    addPublisher(publisherId: string): Promise<void>;

    removePublisher(publisherId: string): Promise<void>;

    publish(publisherId: string, message: TMessage): Promise<void>;
}