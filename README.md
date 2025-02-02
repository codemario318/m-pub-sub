# m-pub-sub

TypeScript로 구현된 간단하고 유연한 메시지 브로커 라이브러리입니다.

## 특징

- 타입 안전성 (`TypeScript` 지원)
- 비동기 메시지 처리
- 채널 기반 발행/구독 패턴
- 유연한 메시지 핸들러 지원 (동기/비동기)


## 사용법

### 기본적인 사용 예시

```typescript
import { MessageBroker } from '@your-org/message-broker';

// 브로커 인스턴스 생성
const broker = new MessageBroker<string>();

// 메시지 구독
const unsubscribe = await broker.subscribe('channel-1', async (message) => {
    console.log(`Received message: ${message}`);
});

// 메시지 발행
await broker.publish('channel-1', 'Hello, World!');

// 구독 취소
await unsubscribe();
```

### 여러 구독자 처리

```typescript
const broker = new MessageBroker<string>();

// 여러 구독자 등록
await broker.subscribe('channel-1', (msg) => console.log(`Subscriber 1: ${msg}`));
await broker.subscribe('channel-1', (msg) => console.log(`Subscriber 2: ${msg}`));

// 모든 구독자에게 메시지 전달
await broker.publish('channel-1', 'Broadcast message');
```

## API

### MessageBroker<TMessage>

메시지 브로커의 메인 클래스입니다.

#### Methods

- `subscribe(channel: string, handler: MessageHandler<TMessage>): Promise<Unsubscribe>`
    - 특정 채널의 메시지를 구독합니다.
    - 반환값으로 구독 취소 함수를 제공합니다.

- `publish(channel: string, message: TMessage): Promise<void>`
    - 특정 채널에 메시지를 발행합니다.
    - 해당 채널의 모든 구독자에게 메시지가 전달됩니다.

## 타입

```typescript
type MessageHandler<TMessage> = (message: TMessage) => void | Promise<void>;
type Unsubscribe = () => Promise<void>;
```

## 라이선스

SIC

```