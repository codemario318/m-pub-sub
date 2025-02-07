import { MessageBroker } from './message-broker';
import { ChannelRepository } from './interfaces';
import { ChannelCleaner } from './channel-cleaner';
import { MemoryChannelRepository } from './memory-channel-repository';

describe('MessageBroker', () => {
    let broker: MessageBroker<string>;
    let channelRepository: ChannelRepository;
    let channelCleaner: ChannelCleaner;

    beforeEach(() => {
        channelRepository = new MemoryChannelRepository();
        channelCleaner = new ChannelCleaner(channelRepository);

        channelCleaner.execute = jest.fn();

        broker = new MessageBroker(channelRepository, channelCleaner);
    });

    describe('생성자', () => {
        it('생성 시 ChannelCleaner를 실행해야 한다', () => {
            expect(channelCleaner.execute).toHaveBeenCalled();
        });
    });

    describe('publish/subscribe', () => {
        it('메시지를 구독자들에게 전달할 수 있다', async () => {
            const handler = jest.fn().mockResolvedValue(undefined);
            const message = 'test message';

            await broker.subscribe('test-topic', handler);
            await broker.publish('test-topic', message);

            expect(handler).toHaveBeenCalledWith(message);
        });

        it('구독 취소 후에는 메시지를 받지 않아야 한다', async () => {
            const handler = jest.fn().mockResolvedValue(undefined);
            const unsubscribe = await broker.subscribe('test-topic', handler);

            await broker.publish('test-topic', 'message1');
            expect(handler).toHaveBeenCalledTimes(1);

            await unsubscribe();
            await broker.publish('test-topic', 'message2');
            expect(handler).toHaveBeenCalledTimes(1);
        });
    });
});
