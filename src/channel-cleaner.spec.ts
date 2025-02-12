import { ChannelCleaner } from './channel-cleaner';
import { Cleanable, CleanableChannelRepository } from './interfaces';

describe('ChannelCleaner', () => {
    let repository: jest.Mocked<CleanableChannelRepository>;
    let cleaner: ChannelCleaner;
    const NOW = Date.now();

    const createMockCleanable = (
        props: {
            topic?: string;
            lastUpdatedAt?: Date;
            subscriberLength?: number;
        } = {},
    ): Cleanable => ({
        topic: props.topic ?? 'test-topic',
        lastUpdatedAt: props.lastUpdatedAt ?? new Date(NOW),
        subscriberLength: props.subscriberLength ?? 0,
    });

    beforeEach(() => {
        jest.spyOn(Date, 'now').mockReturnValue(NOW);

        repository = {
            findAllChannels: jest.fn().mockResolvedValue([]),
            deleteChannelByTopic: jest.fn().mockResolvedValue(undefined),
        };

        cleaner = new ChannelCleaner(repository, {
            interval: 1000,
            staleThreshold: 500,
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    describe('execute', () => {
        it('저장소 조회 실패시 적절히 에러를 처리해야 한다', async () => {
            repository.findAllChannels.mockRejectedValue(
                new Error('Repository error'),
            );

            await expect(cleaner.execute()).rejects.toThrow();
        });

        it('구독자가 없고 설정된 시간이 지난 채널을 삭제해야 한다', async () => {
            const staleChannel = createMockCleanable({
                topic: 'stale-topic',
                lastUpdatedAt: new Date(NOW - 1000),
            });

            repository.findAllChannels.mockResolvedValue([staleChannel]);

            await cleaner.execute();

            expect(repository.deleteChannelByTopic).toHaveBeenCalledWith(
                'stale-topic',
            );
        });

        it('구독자가 있는 채널은 오래되었더라도 삭제하지 않아야 한다', async () => {
            const activeChannel = createMockCleanable({
                topic: 'active-topic',
                lastUpdatedAt: new Date(NOW - 1000),
                subscriberLength: 1,
            });

            repository.findAllChannels.mockResolvedValue([activeChannel]);

            await cleaner.execute();

            expect(repository.deleteChannelByTopic).not.toHaveBeenCalled();
        });

        it('최근에 업데이트된 채널은 구독자가 없어도 삭제하지 않아야 한다', async () => {
            const recentChannel = createMockCleanable({
                topic: 'recent-topic',
                lastUpdatedAt: new Date(NOW - 100),
            });

            repository.findAllChannels.mockResolvedValue([recentChannel]);

            await cleaner.execute();

            expect(repository.deleteChannelByTopic).not.toHaveBeenCalled();
        });

        it('여러 채널을 상태에 따라 적절하게 처리해야 한다', async () => {
            const channels = [
                createMockCleanable({
                    topic: 'recent-topic',
                    lastUpdatedAt: new Date(NOW),
                }),
                createMockCleanable({
                    topic: 'stale-topic',
                    lastUpdatedAt: new Date(NOW - 1000),
                }),
                createMockCleanable({
                    topic: 'active-topic',
                    lastUpdatedAt: new Date(NOW - 1000),
                    subscriberLength: 1,
                }),
            ];

            repository.findAllChannels.mockResolvedValue(channels);

            await cleaner.execute();

            expect(repository.deleteChannelByTopic).toHaveBeenCalledTimes(1);
            expect(repository.deleteChannelByTopic).toHaveBeenCalledWith(
                'stale-topic',
            );
        });

        it('일부 채널 삭제 실패시에도 다른 채널 처리를 계속해야 한다', async () => {
            const channels = [
                createMockCleanable({
                    topic: 'failed-topic',
                    lastUpdatedAt: new Date(NOW - 1000),
                }),
                createMockCleanable({
                    topic: 'success-topic',
                    lastUpdatedAt: new Date(NOW - 1000),
                }),
            ];

            repository.findAllChannels.mockResolvedValue(channels);
            repository.deleteChannelByTopic
                .mockRejectedValueOnce(new Error('Delete failed'))
                .mockResolvedValueOnce(undefined);

            await cleaner.execute();

            expect(repository.deleteChannelByTopic).toHaveBeenCalledTimes(2);
            expect(repository.deleteChannelByTopic).toHaveBeenNthCalledWith(
                1,
                'failed-topic',
            );
            expect(repository.deleteChannelByTopic).toHaveBeenNthCalledWith(
                2,
                'success-topic',
            );
        });
    });
});
