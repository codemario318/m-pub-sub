export type MessageHandler<TMessage> = (message: TMessage) => Promise<void>;
export type Unsubscribe = () => Promise<void>;