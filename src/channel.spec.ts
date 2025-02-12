import { Channel } from './channel';
import { MessageHandler } from './types';

describe('Channel', () => {
    let channel: Channel<string>;
    const topic = 'test-topic';

    beforeEach(() => {
        channel = new Channel(topic);
    });

    describe('subscribe', () => {
        it('구독자를 추가하고 구독 해제 함수를 반환해야 한다', async () => {
            const handler: MessageHandler<string> = jest
                .fn()
                .mockResolvedValue(undefined);

            const subscription = await channel.subscribe(handler);

            expect(channel.subscriberLength).toBe(1);
            expect(subscription.unsubscribe).toBeDefined();
            expect(typeof subscription.unsubscribe).toBe('function');
        });

        it('여러 구독자를 추가할 수 있어야 한다', async () => {
            const handler1: MessageHandler<string> = jest
                .fn()
                .mockResolvedValue(undefined);
            const handler2: MessageHandler<string> = jest
                .fn()
                .mockResolvedValue(undefined);

            await channel.subscribe(handler1);
            await channel.subscribe(handler2);

            expect(channel.subscriberLength).toBe(2);
        });

        it('각 구독자는 고유한 ID를 가져야 한다', async () => {
            const handler: MessageHandler<string> = jest
                .fn()
                .mockResolvedValue(undefined);

            const subscription1 = await channel.subscribe(handler);
            const subscription2 = await channel.subscribe(handler);

            expect(subscription1.id).not.toBe(subscription2.id);
        });
    });

    describe('unsubscribe', () => {
        it('구독 해제시 구독자 목록에서 제거되어야 한다', async () => {
            const handler: MessageHandler<string> = jest
                .fn()
                .mockResolvedValue(undefined);
            const subscription = await channel.subscribe(handler);

            expect(channel.subscriberLength).toBe(1);

            await subscription.unsubscribe();

            expect(channel.subscriberLength).toBe(0);
        });

        it('특정 구독자만 구독 해제되어야 한다', async () => {
            const handler1: MessageHandler<string> = jest
                .fn()
                .mockResolvedValue(undefined);
            const handler2: MessageHandler<string> = jest
                .fn()
                .mockResolvedValue(undefined);

            const subscription1 = await channel.subscribe(handler1);
            await channel.subscribe(handler2);

            await subscription1.unsubscribe();

            expect(channel.subscriberLength).toBe(1);
        });
    });

    describe('publish', () => {
        it('모든 구독자에게 메시지가 전달되어야 한다', async () => {
            const handler1: MessageHandler<string> = jest
                .fn()
                .mockResolvedValue(undefined);
            const handler2: MessageHandler<string> = jest
                .fn()
                .mockResolvedValue(undefined);
            const message = 'test message';

            await channel.subscribe(handler1);
            await channel.subscribe(handler2);

            await channel.publish(message);

            expect(handler1).toHaveBeenCalledWith(message);
            expect(handler2).toHaveBeenCalledWith(message);
        });

        it('구독 해제된 구독자에게는 메시지가 전달되지 않아야 한다', async () => {
            const handler: MessageHandler<string> = jest
                .fn()
                .mockResolvedValue(undefined);
            const message = 'test message';

            const subscription = await channel.subscribe(handler);
            await subscription.unsubscribe();

            await channel.publish(message);

            expect(handler).not.toHaveBeenCalled();
        });

        it('메시지 발행 시 lastUpdatedAt이 갱신되어야 한다', async () => {
            const initialDate = channel.lastUpdatedAt;
            await new Promise((resolve) => setTimeout(resolve, 10)); // 시간 차이를 주기 위한 지연

            await channel.publish('test message');

            expect(channel.lastUpdatedAt.getTime()).toBeGreaterThan(
                initialDate.getTime(),
            );
        });

        it('구독자의 에러가 다른 구독자에게 영향을 주지 않아야 한다', async () => {
            const errorHandler: MessageHandler<string> = jest
                .fn()
                .mockRejectedValue(new Error('Subscriber error'));
            const successHandler: MessageHandler<string> = jest
                .fn()
                .mockResolvedValue(undefined);
            const message = 'test message';

            await channel.subscribe(errorHandler);
            await channel.subscribe(successHandler);

            await channel.publish(message);

            expect(successHandler).toHaveBeenCalledWith(message);
        });
    });

    describe('lastUpdatedAt', () => {
        it('채널 생성 시 현재 시간으로 초기화되어야 한다', () => {
            const now = new Date();
            const channel = new Channel(topic);

            expect(channel.lastUpdatedAt.getTime()).toBeGreaterThanOrEqual(
                now.getTime() - 100,
            );
            expect(channel.lastUpdatedAt.getTime()).toBeLessThanOrEqual(
                now.getTime() + 100,
            );
        });
    });

    describe('subscriberLength', () => {
        it('현재 구독자 수를 정확히 반환해야 한다', async () => {
            expect(channel.subscriberLength).toBe(0);

            const subscription1 = await channel.subscribe(
                jest.fn().mockResolvedValue(undefined),
            );
            expect(channel.subscriberLength).toBe(1);

            const subscription2 = await channel.subscribe(
                jest.fn().mockResolvedValue(undefined),
            );
            expect(channel.subscriberLength).toBe(2);

            await subscription1.unsubscribe();
            expect(channel.subscriberLength).toBe(1);

            await subscription2.unsubscribe();
            expect(channel.subscriberLength).toBe(0);
        });
    });
});
