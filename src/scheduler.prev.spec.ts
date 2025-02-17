import { Scheduler } from './scheduler';
import { ScheduledTask } from './interfaces';

const createMockTask = (
    name: string,
    interval: number,
): jest.Mocked<ScheduledTask> => ({
    name,
    interval,
    execute: jest.fn().mockResolvedValue(undefined),
});

describe.skip('Scheduler (without FakeTimers)', () => {
    let tasks: ScheduledTask[];
    let scheduler: Scheduler;

    beforeEach(() => {
        tasks = [];
        scheduler = new Scheduler(tasks);
    });

    describe('registerTask', () => {
        it('새로운 작업을 등록할 수 있다', () => {
            const mockTask = createMockTask('test-task', 1000);
            expect(() => scheduler.registerTask(mockTask)).not.toThrow();
            expect(tasks.length).toEqual(1);
            expect(tasks[0].name).toEqual(mockTask.name);
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
            const tasks = [mockTask];
            const scheduler = new Scheduler(tasks);

            scheduler.unregisterTask(mockTask.name);

            expect(tasks.length).toEqual(0);
        });

        it('작업 해제 시 실행 중인 작업이 중지되어야 한다', (done) => {
            const mockTask = createMockTask('test-task', 1000);
            const tasks = [mockTask];
            const scheduler = new Scheduler(tasks);

            scheduler.start(mockTask.name);
            scheduler.unregisterTask(mockTask.name);

            setTimeout(() => {
                expect(mockTask.execute).not.toHaveBeenCalled();
                done();
            }, 1500);
        });

        it('등록되지 않은 작업을 해제할 경우 에러가 발생한다', () => {
            expect(() => scheduler.unregisterTask('test-task')).toThrow();
        });
    });

    describe('start', () => {
        it('지정된 간격으로 작업이 실행되어야 한다', (done) => {
            const mockTask = createMockTask('test-task', 1000);
            const tasks = [mockTask];
            const scheduler = new Scheduler(tasks);

            scheduler.start(mockTask.name);

            setTimeout(() => {
                expect(mockTask.execute).toHaveBeenCalledTimes(3);
                scheduler.stop(mockTask.name);
                done();
            }, 3500);
        });

        it('이미 실행 중인 작업은 중복 실행되지 않아야 한다', (done) => {
            const mockTask = createMockTask('test-task', 1000);
            const tasks = [mockTask];
            const scheduler = new Scheduler(tasks);

            scheduler.start(mockTask.name);
            scheduler.start(mockTask.name);

            setTimeout(() => {
                expect(mockTask.execute).toHaveBeenCalledTimes(1);
                scheduler.stop(mockTask.name);
                done();
            }, 1500);
        });

        it('존재하지 않는 작업 실행 시 에러가 발생해야 한다', () => {
            expect(() => scheduler.start('non-existent')).toThrow();
        });
    });

    describe('startAll', () => {
        it('등록된 모든 작업이 실행되어야 한다', (done) => {
            const mockTask1 = createMockTask('task-1', 1000);
            const mockTask2 = createMockTask('task-2', 2000);

            const tasks = [mockTask1, mockTask2];
            const scheduler = new Scheduler(tasks);

            scheduler.startAll();

            setTimeout(() => {
                expect(mockTask1.execute).toHaveBeenCalledTimes(2);
                expect(mockTask2.execute).toHaveBeenCalledTimes(1);
                scheduler.stopAll();
                done();
            }, 2500);
        });
    });

    describe('stop', () => {
        it('특정 작업이 중지되어야 한다', (done) => {
            const mockTask = createMockTask('test-task', 1000);
            const tasks = [mockTask];
            const scheduler = new Scheduler(tasks);

            scheduler.start(mockTask.name);

            setTimeout(() => {
                scheduler.stop(mockTask.name);
                setTimeout(() => {
                    expect(mockTask.execute).toHaveBeenCalledTimes(1);
                    done();
                }, 2000);
            }, 1500);
        });
    });

    describe('stopAll', () => {
        it('실행 중인 모든 작업이 중지되어야 한다', (done) => {
            const mockTask1 = createMockTask('task-1', 1000);
            const mockTask2 = createMockTask('task-2', 2000);

            const tasks = [mockTask1, mockTask2];
            const scheduler = new Scheduler(tasks);

            scheduler.startAll();

            setTimeout(() => {
                scheduler.stopAll();
                setTimeout(() => {
                    expect(mockTask1.execute).toHaveBeenCalledTimes(1);
                    expect(mockTask2.execute).toHaveBeenCalledTimes(0);
                    done();
                }, 2000);
            }, 1500);
        });
    });

    describe('동시 실행 방지', () => {
        it('동일한 작업이 동시에 실행되지 않아야 한다', (done) => {
            let executionCount = 0;
            const mockTask = createMockTask('test-task', 1000);
            mockTask.execute.mockImplementation(async () => {
                executionCount++;
                await new Promise((resolve) => setTimeout(resolve, 2000));
            });

            const tasks = [mockTask];
            const scheduler = new Scheduler(tasks);

            scheduler.start(mockTask.name);

            setTimeout(() => {
                expect(executionCount).toEqual(1);
                setTimeout(() => {
                    expect(executionCount).toEqual(2);
                    scheduler.stop(mockTask.name);
                    done();
                }, 1500);
            }, 1500);
        });
    });
});
