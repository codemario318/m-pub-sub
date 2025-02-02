import { MessageBroker } from './message-broker';

describe('MessageBroker', () => {
    let broker: MessageBroker<string>;

    beforeEach(() => {
        broker = new MessageBroker();
    });

    describe('addPublisher', () => {
        it('새로운 발행자를 추가할 수 있다', async () => {
            await expect(broker.addPublisher('publisher-1')).resolves.toBeUndefined();
        });

        it('이미 존재하는 발행자 ID로 추가하면 에러가 발생한다', async () => {
            await broker.addPublisher('publisher-1');
            await expect(broker.addPublisher('publisher-1')).rejects.toThrow('Publisher with ID publisher-1 already exists');
        });
    });

    describe('removePublisher', () => {
        it('존재하는 발행자를 제거할 수 있다', async () => {
            await broker.addPublisher('publisher-1');
            await expect(broker.removePublisher('publisher-1')).resolves.toBeUndefined();
        });

        it('존재하지 않는 발행자를 제거하려고 하면 에러가 발생한다', async () => {
            await expect(broker.removePublisher('non-existent')).rejects.toThrow('Publisher with ID non-existent does not exist');
        });
    });

    describe('publish', () => {
        it('메시지를 구독자들에게 전달할 수 있다', async () => {
            const handler1 = jest.fn();
            const handler2 = jest.fn();
            const message = 'test message';

            await broker.addPublisher('publisher-1');
            await broker.subscribe('publisher-1', handler1);
            await broker.subscribe('publisher-1', handler2);

            await broker.publish('publisher-1', message);

            expect(handler1).toHaveBeenCalledWith(message);
            expect(handler2).toHaveBeenCalledWith(message);
        });

        it('존재하지 않는 발행자로 메시지를 발행하려고 하면 에러가 발생한다', async () => {
            await expect(broker.publish('non-existent', 'message')).rejects.toThrow('Publisher with ID non-existent does not exist');
        });
    });

    describe('subscribe', () => {
        it('발행자의 메시지를 구독할 수 있다', async () => {
            await broker.addPublisher('publisher-1');
            const unsubscribe = await broker.subscribe('publisher-1', jest.fn());
            expect(typeof unsubscribe).toBe('function');
        });

        it('존재하지 않는 발행자를 구독하려고 하면 에러가 발생한다', async () => {
            await expect(broker.subscribe('non-existent', jest.fn())).rejects.toThrow('Publisher with ID non-existent does not exist');
        });

        it('구독 취소 후에는 메시지를 받지 않는다', async () => {
            const handler = jest.fn();
            await broker.addPublisher('publisher-1');
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

            await broker.addPublisher('publisher-1');
            await broker.subscribe('publisher-1', handler1);
            await broker.subscribe('publisher-1', handler2);

            await broker.publish('publisher-1', 'test');

            expect(handler1).toHaveBeenCalledWith('test');
            expect(handler2).toHaveBeenCalledWith('test');
        });
    });
});