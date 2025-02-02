import { MessageBroker } from './message-broker';

describe('MessageBroker', () => {
    let broker: MessageBroker<string>;

    beforeEach(() => {
        broker = new MessageBroker();
    });

    describe('publish', () => {
        it('메시지를 구독자들에게 전달할 수 있다', async () => {
            const handler1 = jest.fn();
            const handler2 = jest.fn();
            const message = 'test message';

            await broker.subscribe('publisher-1', handler1);
            await broker.subscribe('publisher-1', handler2);

            await broker.publish('publisher-1', message);

            expect(handler1).toHaveBeenCalledWith(message);
            expect(handler2).toHaveBeenCalledWith(message);
        });
    });

    describe('subscribe', () => {
        it('발행자의 메시지를 구독할 수 있다', async () => {
            const unsubscribe = await broker.subscribe('publisher-1', jest.fn());
            expect(typeof unsubscribe).toBe('function');
        });

        it('구독 취소 후에는 메시지를 받지 않는다', async () => {
            const handler = jest.fn();
            const unsubscribe = await broker.subscribe('publisher-1', handler);

            await broker.publish('publisher-1', 'message1');
            expect(handler).toHaveBeenCalledTimes(1);

            await unsubscribe();
            await broker.publish('publisher-1', 'message2');
            expect(handler).toHaveBeenCalledTimes(1); // 여전히 1회만 호출됨
        });
    });

    describe('동시성 처리', () => {
        it('여러 구독자에게 동시에 메시지를 전달할 수 있다', async () => {
            const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

            const handler1 = jest.fn().mockImplementation(() => delay(100));
            const handler2 = jest.fn().mockImplementation(() => delay(50));

            await broker.subscribe('publisher-1', handler1);
            await broker.subscribe('publisher-1', handler2);

            await broker.publish('publisher-1', 'test');

            expect(handler1).toHaveBeenCalledWith('test');
            expect(handler2).toHaveBeenCalledWith('test');
        });
    });
});