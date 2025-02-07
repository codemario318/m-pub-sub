import { MemoryChannelRepository } from './memory-channel-repository';
import { Channel } from './channel';

describe('MemoryChannelRepository', () => {
    let repository: MemoryChannelRepository<string>;

    beforeEach(() => {
        repository = new MemoryChannelRepository();
    });

    describe('findChannelByTopic', () => {
        it('존재하지 않는 토픽으로 조회시 새로운 채널을 생성해야 한다', async () => {
            const topic = 'test-topic';
            const channel = await repository.findChannelByTopic(topic);

            expect(channel).toBeInstanceOf(Channel);
            expect(channel.topic).toBe(topic);
        });

        it('이미 존재하는 토픽으로 조회시 기존 채널을 반환해야 한다', async () => {
            const topic = 'test-topic';
            const firstChannel = await repository.findChannelByTopic(topic);
            const secondChannel = await repository.findChannelByTopic(topic);

            expect(firstChannel).toBe(secondChannel);
        });
    });

    describe('findAllChannels', () => {
        it('생성된 모든 채널을 반환해야 한다', async () => {
            await repository.findChannelByTopic('topic1');
            await repository.findChannelByTopic('topic2');
            await repository.findChannelByTopic('topic3');

            const channels = await repository.findAllChannels();
            expect(channels).toHaveLength(3);
            expect(channels.map((c) => c.topic)).toEqual([
                'topic1',
                'topic2',
                'topic3',
            ]);
        });

        it('채널이 없을 경우 빈 배열을 반환해야 한다', async () => {
            const channels = await repository.findAllChannels();
            expect(channels).toHaveLength(0);
        });
    });

    describe('deleteChannelByTopic', () => {
        it('토픽을 이용해 저장소에서 채널을 제거해야 한다', async () => {
            const topic = 'test-topic';
            await repository.deleteChannelByTopic(topic);

            const channels = await repository.findAllChannels();
            expect(channels).toHaveLength(0);
        });

        it('존재하지 않는 채널 삭제 시 에러가 발생하지 않아야 한다', async () => {
            await expect(
                repository.deleteChannelByTopic('nonExistentChannel'),
            ).resolves.not.toThrow();
        });

        it('하나의 채널 삭제가 다른 채널에 영향을 주지 않아야 한다', async () => {
            const channel1 = await repository.findChannelByTopic('topic1');
            await repository.findChannelByTopic('topic2');

            await repository.deleteChannelByTopic(channel1.topic);

            const channels = await repository.findAllChannels();
            expect(channels).toHaveLength(1);
            expect(channels[0].topic).toBe('topic2');
        });
    });
});
