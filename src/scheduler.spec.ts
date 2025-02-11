import { Scheduler } from './scheduler';
import { ScheduledTask } from './interfaces/scheduled-task.interface';

const createMockTask = (
    name: string,
    interval: number,
): jest.Mocked<ScheduledTask> => ({
    name,
    interval,
    execute: jest.fn().mockResolvedValue(undefined),
});

describe('Scheduler 테스트', () => {
    let scheduler: Scheduler;

    beforeEach(() => {
        scheduler = new Scheduler();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    describe('registerTask', () => {
        it('새로운 작업을 등록할 수 있다', () => {
            const mockTask = createMockTask('test-task', 1000);
            expect(() => scheduler.registerTask(mockTask)).not.toThrow();
        });

        it('이미 존재하는 이름으로 작업 등록 시 에러가 발생해야 한다', () => {
            const mockTask1 = createMockTask('test-task', 1000);
            const mockTask2 = createMockTask('test-task', 2000);

            scheduler.registerTask(mockTask1);

            expect(() => scheduler.registerTask(mockTask2)).toThrow();
        });
    });

    describe('unregisterTask', () => {
        it('등록된 작업을 해제할 수 있다', () => {
            const mockTask = createMockTask('test-task', 1000);

            scheduler.registerTask(mockTask);
            scheduler.start(mockTask.name);

            scheduler.unregisterTask(mockTask.name);

            expect(() => scheduler.start(mockTask.name)).toThrow();
        });

        it('작업 해제 시 실행 중인 작업이 중지되어야 한다', async () => {
            const mockTask = createMockTask('test-task', 1000);

            scheduler.registerTask(mockTask);
            scheduler.start(mockTask.name);

            scheduler.unregisterTask(mockTask.name);

            jest.advanceTimersByTime(2000);
            await Promise.resolve();

            expect(mockTask.execute).not.toHaveBeenCalled();
        });
    });

    describe('start', () => {
        it('지정된 간격으로 작업이 실행되어야 한다', async () => {
            const mockTask = createMockTask('test-task', 1000);

            scheduler.registerTask(mockTask);
            scheduler.start(mockTask.name);

            jest.advanceTimersByTime(1000);
            await Promise.resolve();

            jest.advanceTimersByTime(1000);
            await Promise.resolve();

            jest.advanceTimersByTime(1000);
            await Promise.resolve();

            expect(mockTask.execute).toHaveBeenCalledTimes(3);
        });

        it('이미 실행 중인 작업은 중복 실행되지 않아야 한다', async () => {
            const mockTask = createMockTask('test-task', 1000);

            scheduler.registerTask(mockTask);

            scheduler.start(mockTask.name);
            scheduler.start(mockTask.name);

            jest.advanceTimersByTime(1500);
            await Promise.resolve();

            expect(mockTask.execute).toHaveBeenCalledTimes(1);
        });

        it('존재하지 않는 작업 실행 시 에러가 발생해야 한다', () => {
            expect(() => scheduler.start('non-existent')).toThrow();
        });
    });

    describe('startAll', () => {
        it('등록된 모든 작업이 실행되어야 한다', async () => {
            const mockTask1 = createMockTask('task-1', 1000);
            const mockTask2 = createMockTask('task-2', 2000);

            scheduler.registerTask(mockTask1);
            scheduler.registerTask(mockTask2);
            scheduler.startAll();

            jest.advanceTimersByTime(1000);
            await Promise.resolve();

            jest.advanceTimersByTime(1000);
            await Promise.resolve();

            expect(mockTask1.execute).toHaveBeenCalledTimes(2);
            expect(mockTask2.execute).toHaveBeenCalledTimes(1);
        });
    });

    describe('stop', () => {
        it('특정 작업이 중지되어야 한다', async () => {
            const mockTask = createMockTask('test-task', 1000);

            scheduler.registerTask(mockTask);
            scheduler.start(mockTask.name);

            jest.advanceTimersByTime(1500);
            await Promise.resolve();

            scheduler.stop(mockTask.name);

            jest.advanceTimersByTime(2000);
            await Promise.resolve();

            expect(mockTask.execute).toHaveBeenCalledTimes(1);
        });
    });

    describe('stopAll', () => {
        it('실행 중인 모든 작업이 중지되어야 한다', async () => {
            const mockTask1 = createMockTask('task-1', 1000);
            const mockTask2 = createMockTask('task-2', 2000);

            scheduler.registerTask(mockTask1);
            scheduler.registerTask(mockTask2);
            scheduler.startAll();

            jest.advanceTimersByTime(1500);
            await Promise.resolve();

            scheduler.stopAll();

            jest.advanceTimersByTime(2000);
            await Promise.resolve();

            expect(mockTask1.execute).toHaveBeenCalledTimes(1);
            expect(mockTask2.execute).toHaveBeenCalledTimes(0);
        });
    });

    describe('동시 실행 방지', () => {
        it('동일한 작업이 동시에 실행되지 않아야 한다', async () => {
            const mockTask = createMockTask('test-task', 1000);

            // 3초가 걸리는 작업
            mockTask.execute.mockImplementation(async () =>
                jest.advanceTimersByTime(3000),
            );

            scheduler.registerTask(mockTask);
            scheduler.start(mockTask.name);

            jest.advanceTimersByTime(2000);
            await Promise.resolve();

            expect(mockTask.execute).toHaveBeenCalledTimes(1);

            jest.advanceTimersByTime(1000);
            await Promise.resolve();

            expect(mockTask.execute).toHaveBeenCalledTimes(2);
        });
    });
});
