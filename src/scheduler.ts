import { ScheduledTask } from './interfaces';

export class Scheduler {
    private readonly timers: Map<string, NodeJS.Timeout> = new Map();
    private readonly runningTasks: Set<string> = new Set();

    constructor(private readonly tasks: Map<string, ScheduledTask>) {}

    public registerTask(task: ScheduledTask) {
        if (this.tasks.has(task.name)) {
            throw new Error(`Task with name ${task.name} already exists`);
        }
        this.tasks.set(task.name, task);
    }

    public unregisterTask(taskName: string) {
        this.stop(taskName);
        this.tasks.delete(taskName);
    }

    public start(taskName: string) {
        const task = this.tasks.get(taskName);

        if (!task) {
            throw new Error(`Task ${taskName} not found`);
        }

        if (this.timers.has(taskName)) {
            return;
        }

        const timer = setInterval(() => this.executeTask(task), task.interval);

        this.timers.set(taskName, timer);
    }

    public startAll() {
        for (const task of this.tasks.values()) {
            this.start(task.name);
        }
    }

    public stop(taskName: string) {
        const timer = this.timers.get(taskName);
        if (timer !== undefined) {
            clearInterval(timer);
            this.timers.delete(taskName);
        }
    }

    public stopAll() {
        for (const taskName of this.timers.keys()) {
            this.stop(taskName);
        }
    }

    private async executeTask(task: ScheduledTask) {
        if (this.runningTasks.has(task.name)) {
            return;
        }

        this.runningTasks.add(task.name);

        try {
            await task.execute();
        } finally {
            this.runningTasks.delete(task.name);
        }
    }
}
