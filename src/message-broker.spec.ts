import { MessageBroker } from './message-broker';
import { ChannelRepository } from './interfaces';
import { Scheduler } from './scheduler';
import { Channel } from './channel';
import { ScheduledTask } from './interfaces';

describe('MessageBroker', () => {
    let broker: MessageBroker<string>;
    let repository: jest.Mocked<ChannelRepository<string>>;
    let scheduler: jest.Mocked<Scheduler>;
    let mockTask: jest.Mocked<ScheduledTask>;
    let testChannel: Channel<string>;

    beforeEach(() => {
        jest.useFakeTimers();

        mockTask = {
            name: 'MockTask',
            interval: 100,
            execute: jest.fn().mockResolvedValue(undefined),
        } as jest.Mocked<ScheduledTask>;

        testChannel = new Channel('test-topic');

        repository = {
            findChannelByTopic: jest.fn().mockResolvedValue(testChannel),
            findAllChannels: jest.fn().mockResolvedValue([testChannel]),
            deleteChannelByTopic: jest.fn().mockResolvedValue(undefined),
        };

        scheduler = {
            registerTask: jest.fn(),
            unregisterTask: jest.fn(),
            start: jest.fn(),
            startAll: jest.fn(),
            stop: jest.fn(),
            stopAll: jest.fn(),
        } as unknown as jest.Mocked<Scheduler>;
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    describe('초기화', () => {
        it('브로커 생성시 태스크가 등록되고 스케줄러가 시작된다', () => {
            broker = new MessageBroker(repository, scheduler, [mockTask]);

            expect(scheduler.registerTask).toHaveBeenCalledWith(mockTask);
            expect(scheduler.startAll).toHaveBeenCalled();
        });

        it('여러 태스크를 등록할 수 있다', () => {
            const mockTask2 = {
                name: 'MockTask2',
                interval: 200,
                execute: jest.fn(),
            } as jest.Mocked<ScheduledTask>;

            broker = new MessageBroker(repository, scheduler, [
                mockTask,
                mockTask2,
            ]);

            expect(scheduler.registerTask).toHaveBeenCalledWith(mockTask);
            expect(scheduler.registerTask).toHaveBeenCalledWith(mockTask2);
            expect(scheduler.registerTask).toHaveBeenCalledTimes(2);
        });
    });

    describe('메시지 전달', () => {
        beforeEach(() => {
            broker = new MessageBroker(repository, scheduler, [mockTask]);
        });

        it('구독자가 발행된 메시지를 받을 수 있다', async () => {
            const handler = jest.fn().mockResolvedValue(undefined);
            const message = 'test message';

            await broker.subscribe('test-topic', handler);
            await broker.publish('test-topic', message);

            await Promise.resolve();

            expect(handler).toHaveBeenCalledWith(message);
        });

        it('여러 구독자가 같은 메시지를 받을 수 있다', async () => {
            const handler1 = jest.fn().mockResolvedValue(undefined);
            const handler2 = jest.fn().mockResolvedValue(undefined);
            const message = 'test message';

            await broker.subscribe('test-topic', handler1);
            await broker.subscribe('test-topic', handler2);
            await broker.publish('test-topic', message);

            await Promise.resolve();

            expect(handler1).toHaveBeenCalledWith(message);
            expect(handler2).toHaveBeenCalledWith(message);
        });

        it('다른 토픽의 구독자는 메시지를 받지 않는다', async () => {
            const topic1Channel: Channel<string> = new Channel('topic1');
            const topic2Channel: Channel<string> = new Channel('topic2');
            repository.findChannelByTopic.mockImplementation(async (topic) => {
                if (topic === 'topic1') return topic1Channel;
                if (topic === 'topic2') return topic2Channel;
                throw new Error('Unknown topic');
            });

            const handler1 = jest.fn().mockResolvedValue(undefined);
            const handler2 = jest.fn().mockResolvedValue(undefined);
            const message = 'test message';

            await broker.subscribe('topic1', handler1);
            await broker.subscribe('topic2', handler2);
            await broker.publish('topic1', message);

            await Promise.resolve();

            expect(handler1).toHaveBeenCalledWith(message);
            expect(handler2).not.toHaveBeenCalled();
        });
    });

    describe('구독 관리', () => {
        beforeEach(() => {
            broker = new MessageBroker(repository, scheduler, [mockTask]);
        });

        it('구독 취소 후에는 메시지를 받지 않는다', async () => {
            const handler = jest.fn().mockResolvedValue(undefined);
            const unsubscribe = await broker.subscribe('test-topic', handler);

            await unsubscribe();
            await broker.publish('test-topic', 'message');

            await Promise.resolve();

            expect(handler).not.toHaveBeenCalled();
        });

        it('한 구독자의 구독 취소는 다른 구독자에게 영향을 주지 않는다', async () => {
            const handler1 = jest.fn().mockResolvedValue(undefined);
            const handler2 = jest.fn().mockResolvedValue(undefined);
            const message = 'test message';

            const unsubscribe1 = await broker.subscribe('test-topic', handler1);
            await broker.subscribe('test-topic', handler2);

            await unsubscribe1();
            await broker.publish('test-topic', message);

            await Promise.resolve();

            expect(handler1).not.toHaveBeenCalled();
            expect(handler2).toHaveBeenCalledWith(message);
        });
    });

    describe('에러 처리', () => {
        beforeEach(() => {
            broker = new MessageBroker(repository, scheduler, [mockTask]);
        });

        it('구독자의 에러가 다른 구독자에게 영향을 주지 않는다', async () => {
            const errorHandler = jest
                .fn()
                .mockRejectedValue(new Error('에러 발생'));
            const successHandler = jest.fn().mockResolvedValue(undefined);
            const message = 'test message';

            await broker.subscribe('test-topic', errorHandler);
            await broker.subscribe('test-topic', successHandler);
            await broker.publish('test-topic', message);

            await Promise.resolve();

            expect(successHandler).toHaveBeenCalledWith(message);
        });

        it('채널을 찾을 수 없을 때 에러가 발생한다', async () => {
            repository.findChannelByTopic.mockRejectedValue(
                new Error('Channel not found'),
            );

            await expect(
                broker.publish('non-existent', 'message'),
            ).rejects.toThrow('Channel not found');
        });
    });
});
