# m-pub-sub

TypeScript로 구현된 간단하고 유연한 메시지 브로커 라이브러리입니다.

## 특징

- 타입 안전성 (`TypeScript` 지원)
- 비동기 메시지 처리
- 채널 기반 발행/구독 패턴
- 자동 채널 정리 (오래된 미사용 채널 제거)
- 스케줄러를 통한 백그라운드 작업 지원
- 메모리 기반의 간단한 채널 저장소
- 유연한 메시지 핸들러 지원 (Promise 기반)

## 사용법

```typescript
// 브로커 인스턴스 생성
const broker = new MessageBroker<string>();

// 메시지 구독 - Promise를 반환하는 핸들러 필요
const unsubscribe = await broker.subscribe('channel-1', async (message) => {
    console.log(`Received message: ${message}`);
});

// 메시지 발행
await broker.publish('channel-1', 'Hello, World!');

// 구독 취소
await unsubscribe();
```

## API

### MessageBroker<TMessage>

메시지 브로커의 메인 클래스입니다.

#### Constructor Options

```typescript
constructor(
    repository?: ChannelRepository<TMessage>,
    scheduler?: Scheduler,
    tasks?: ScheduledTask[]
)
```

- `repository`: 채널 저장소 (기본값: `MemoryChannelRepository`)
- `scheduler`: 스케줄러 인스턴스 (기본값: `new Scheduler()`)
- `tasks`: 실행할 백그라운드 작업 목록 (기본값: `[new ChannelCleaner()]`)

#### Methods

- `subscribe(topic: string, handler: MessageHandler<TMessage>): Promise<Unsubscribe>`
  - 특정 토픽의 메시지를 구독합니다
  - Promise를 반환하는 핸들러가 필요합니다
  - 반환값으로 구독 취소 함수를 제공합니다

- `publish(topic: string, message: TMessage): Promise<void>`
  - 특정 토픽에 메시지를 발행합니다
  - 해당 토픽의 모든 구독자에게 메시지가 전달됩니다

## 타입

```typescript
type MessageHandler<TMessage> = (message: TMessage) => Promise<void>;
type Unsubscribe = () => Promise<void>;
```

## 사용 예시

### ChannelCleaner 설정

```typescript
// 기본값
const DEFAULT_OPTIONS = {
    interval: 3600,
    staleThreshold: 1800
};
```

- `interval`: Cleaner 실행 주기 (밀리초)
- `staleThreshold`: 채널을 정리하기 위한 미사용 시간 기준 (밀리초)
  - 구독자가 없고, 마지막 업데이트 후 이 시간이 지난 채널이 정리됩니다
  - 구독자가 있는 채널은 이 시간이 지나도 정리되지 않습니다

```typescript
const repository = new MemoryChannelRepository();
const scheduler = new Scheduler()

const cleaner = new ChannelCleaner(repository, {
  interval: 1800000,     // 30분마다 실행 (기본값: 1시간)
  staleThreshold: 900000 // 15분 이상 미사용 채널 정리 (기본값: 30분)
});

const broker = new MessageBroker<string>(
        repository,
        scheduler,
        [cleaner]
);
```

혹은

```typescript
const repository = new MemoryChannelRepository();
const scheduler = new Scheduler([
  new ChannelCleaner(repository, {
    interval: 1800000,     // 30분마다 실행 (기본값: 1시간)
    staleThreshold: 900000 // 15분 이상 미사용 채널 정리 (기본값: 30분)
  })
]);

const broker = new MessageBroker<string>(repository, scheduler, []);
```

### 커스텀 브로커 설정

```typescript
// ChannelCleaner 없이 브로커 생성
const repository = new MemoryChannelRepository<string>();
const scheduler = new Scheduler();
const broker = new MessageBroker<string>(repository, scheduler, []);

// 사용
await broker.subscribe('my-topic', async (msg) => console.log(msg));
await broker.publish('my-topic', 'Hello!');
```

### 커스텀 스케줄링 작업 추가

```typescript
// 커스텀 작업 정의
class MetricsCollector implements ScheduledTask {
    readonly name = 'MetricsCollector';
    readonly interval = 60000; // 1분마다 실행

    async execute(): Promise<void> {
        const metrics = await collectSystemMetrics();
        console.log('System metrics:', metrics);
    }
}

// 브로커 생성 시 커스텀 작업 추가
const broker = new MessageBroker<string>(
    undefined, // 기본 저장소 사용
    undefined, // 기본 스케줄러 사용
    [new MetricsCollector()] // 커스텀 작업 추가
);
```

## 라이선스

SIC