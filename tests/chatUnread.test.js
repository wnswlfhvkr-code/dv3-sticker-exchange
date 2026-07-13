import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createChatReadCursor,
  getChatMessageKey,
  getChatReadStorageKey,
  getChatSyncStorageKey,
  getChatUnreadStorageKey,
  getLatestMessageTimestamp,
  getUnreadIncomingMessages,
  getRoomIdFromUnreadStorageKey,
  mergeChatReadCursors,
  mergeUnreadIncomingMessages,
  parseChatReadCursor,
  resolveUnreadSnapshot
} from '../src/features/chat/unreadTracking.js';

const messages = [
  { id: '1', sender: '간장', text: 'old', timestamp: '2026-07-13T01:00:00.000Z' },
  { id: '2', sender: '준영', text: 'reply', timestamp: '2026-07-13T01:05:00.000Z' },
  { id: '3', sender: '간장', text: 'offline one', timestamp: '2026-07-13T02:00:00.000Z' },
  { id: '4', sender: '간장', text: 'offline two', timestamp: '2026-07-13T02:01:00.000Z' }
];

test('counts only incoming messages newer than the room read position', () => {
  const unread = getUnreadIncomingMessages(
    messages,
    '준영',
    '2026-07-13T01:05:00.000Z'
  );

  assert.deepEqual(unread.map((message) => message.id), ['3', '4']);
});

test('does not treat message history as unread without an established baseline', () => {
  assert.deepEqual(getUnreadIncomingMessages(messages, '준영', null), []);
});

test('finds the latest valid message timestamp', () => {
  assert.equal(
    getLatestMessageTimestamp([...messages].reverse(), '2026-07-13T00:00:00.000Z'),
    '2026-07-13T02:01:00.000Z'
  );
});

test('scopes read and sync positions by nickname and room', () => {
  assert.notEqual(
    getChatReadStorageKey('간장', 'room-a-b'),
    getChatReadStorageKey('준영', 'room-a-b')
  );
  assert.notEqual(getChatSyncStorageKey('간장'), getChatSyncStorageKey('준영'));
  assert.notEqual(
    getChatUnreadStorageKey('간장', 'room-a-b'),
    getChatUnreadStorageKey('준영', 'room-a-b')
  );
  assert.equal(
    getRoomIdFromUnreadStorageKey('준영', getChatUnreadStorageKey('준영', 'room-a-b')),
    'room-a-b'
  );
});

test('bootstraps existing history without flooding the user with old unread badges', () => {
  const snapshot = resolveUnreadSnapshot({
    messages,
    nickname: '준영',
    lastReadCursor: null,
    previousSyncAt: null
  });

  assert.equal(snapshot.isBootstrap, true);
  assert.equal(snapshot.unreadCount, 0);
  assert.deepEqual(parseChatReadCursor(snapshot.lastReadCursor), {
    timestamp: '2026-07-13T02:01:00.000Z',
    messageIds: ['4']
  });
});

test('recovers every incoming message in a room created after the first connection', () => {
  const snapshot = resolveUnreadSnapshot({
    messages: messages.slice(2),
    nickname: '준영',
    lastReadCursor: null,
    previousSyncAt: '2026-07-13T03:00:00.000Z'
  });

  assert.equal(snapshot.isBootstrap, false);
  assert.equal(snapshot.unreadCount, 2);
  assert.deepEqual(snapshot.unreadMessages.map((message) => message.id), ['3', '4']);
});

test('uses message ids to distinguish messages with the same timestamp', () => {
  const timestamp = '2026-07-13T02:00:00.000Z';
  const firstMessage = { id: 'same-1', sender: '간장', text: 'first', timestamp };
  const secondMessage = { id: 'same-2', sender: '간장', text: 'second', timestamp };
  const cursor = createChatReadCursor([firstMessage]);

  assert.deepEqual(
    getUnreadIncomingMessages([firstMessage, secondMessage], '준영', cursor)
      .map((message) => message.id),
    ['same-2']
  );
});

test('never moves a read cursor backward', () => {
  const currentCursor = createChatReadCursor([messages[3]]);
  const staleCursor = createChatReadCursor([messages[0]]);

  assert.deepEqual(mergeChatReadCursors(currentCursor, staleCursor), currentCursor);
});

test('counts unread messages beyond a single 1000-row page', () => {
  const longHistory = Array.from({ length: 1005 }, (_, index) => ({
    id: `long-${index}`,
    sender: '간장',
    text: `message ${index}`,
    timestamp: new Date(Date.UTC(2026, 6, 13, 0, 0, index)).toISOString()
  }));
  const cursor = createChatReadCursor(longHistory.slice(0, 5));

  assert.equal(getUnreadIncomingMessages(longHistory, '준영', cursor).length, 1000);
});

test('merges realtime messages received during catch-up without duplicates or omissions', () => {
  const roomId = 'room-간장-준영';
  const offlineMessages = messages.slice(2).map((message) => ({ ...message, roomId }));
  const realtimeMessage = {
    id: '5',
    roomId,
    sender: '간장',
    text: 'arrived during sync',
    timestamp: '2026-07-13T02:02:00.000Z'
  };

  const merged = mergeUnreadIncomingMessages({
    snapshotMessages: [...offlineMessages, realtimeMessage],
    realtimeMessages: [realtimeMessage],
    nickname: '준영',
    roomId
  });

  assert.deepEqual(merged.map((message) => message.id), ['3', '4', '5']);
  assert.equal(new Set(merged.map((message) => getChatMessageKey(roomId, message))).size, 3);
});
