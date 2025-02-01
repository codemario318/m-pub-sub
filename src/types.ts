export type MessageHandler<TMessage> = (message: TMessage) => void | Promise<void>;