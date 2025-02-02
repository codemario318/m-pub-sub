export type MessageHandler<TMessage> = (message: TMessage) => void | Promise<void>;
export type Unsubscribe = () => Promise<void>;