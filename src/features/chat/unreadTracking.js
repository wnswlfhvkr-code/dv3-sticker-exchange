const parseTimestamp = (value) => {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : null;
};

const encodeKeyPart = (value) => encodeURIComponent(String(value || ''));

export const getChatMessageKey = (roomId, message) => {
  const fallbackIdentity = [message?.timestamp, message?.sender, message?.text]
    .map(encodeKeyPart)
    .join(':');
  return `${encodeKeyPart(roomId)}:${message?.id || fallbackIdentity}`;
};

export const getChatReadStorageKey = (nickname, roomId) => (
  `dv3_chat_last_read_${encodeKeyPart(nickname)}_${encodeKeyPart(roomId)}`
);

export const getChatSyncStorageKey = (nickname) => (
  `dv3_chat_last_sync_${encodeKeyPart(nickname)}`
);

export const getChatUnreadStoragePrefix = (nickname) => (
  `dv3_unread_${encodeKeyPart(nickname)}__`
);

export const getChatUnreadStorageKey = (nickname, roomId) => (
  `${getChatUnreadStoragePrefix(nickname)}${encodeKeyPart(roomId)}`
);

export const getRoomIdFromUnreadStorageKey = (nickname, storageKey) => {
  const prefix = getChatUnreadStoragePrefix(nickname);
  if (!storageKey?.startsWith(prefix)) return null;

  try {
    return decodeURIComponent(storageKey.slice(prefix.length));
  } catch {
    return null;
  }
};

export const parseChatReadCursor = (value) => {
  if (!value) return null;
  if (typeof value === 'object' && value.timestamp) {
    return {
      timestamp: value.timestamp,
      messageIds: Array.isArray(value.messageIds)
        ? [...new Set(value.messageIds.map(String))]
        : null
    };
  }

  try {
    const parsed = JSON.parse(value);
    if (parsed?.timestamp) return parseChatReadCursor(parsed);
  } catch {
    // Legacy values stored only an ISO timestamp.
  }

  return parseTimestamp(value) === null
    ? null
    : { timestamp: value, messageIds: null };
};

export const serializeChatReadCursor = (cursor) => {
  const parsed = parseChatReadCursor(cursor);
  return parsed ? JSON.stringify(parsed) : null;
};

export const getLatestMessageTimestamp = (messages, fallback = null) => {
  let latestTimestamp = fallback;
  let latestTime = parseTimestamp(fallback) ?? Number.NEGATIVE_INFINITY;

  for (const message of messages || []) {
    const messageTime = parseTimestamp(message?.timestamp);
    if (messageTime !== null && messageTime >= latestTime) {
      latestTime = messageTime;
      latestTimestamp = message.timestamp;
    }
  }

  return latestTimestamp;
};

export const createChatReadCursor = (messages) => {
  const latestTimestamp = getLatestMessageTimestamp(messages);
  const latestTime = parseTimestamp(latestTimestamp);
  if (latestTime === null) return null;

  const messageIds = (messages || [])
    .filter((message) => parseTimestamp(message?.timestamp) === latestTime && message?.id != null)
    .map((message) => String(message.id));

  return {
    timestamp: latestTimestamp,
    messageIds: [...new Set(messageIds)]
  };
};

export const mergeChatReadCursors = (currentCursor, nextCursor) => {
  const current = parseChatReadCursor(currentCursor);
  const next = parseChatReadCursor(nextCursor);
  if (!current) return next;
  if (!next) return current;

  const currentTime = parseTimestamp(current.timestamp);
  const nextTime = parseTimestamp(next.timestamp);
  if (nextTime > currentTime) return next;
  if (nextTime < currentTime) return current;
  if (current.messageIds === null && next.messageIds === null) return current;

  return {
    timestamp: next.timestamp,
    messageIds: [...new Set([...(current.messageIds || []), ...(next.messageIds || [])])]
  };
};

export const getUnreadIncomingMessages = (messages, nickname, lastReadCursor) => {
  const cursor = parseChatReadCursor(lastReadCursor);
  const lastReadTime = parseTimestamp(cursor?.timestamp);
  if (lastReadTime === null) return [];

  const boundaryMessageIds = cursor.messageIds === null
    ? null
    : new Set(cursor.messageIds);

  return (messages || []).filter((message) => {
    if (!message || message.sender === nickname) return false;
    const messageTime = parseTimestamp(message.timestamp);
    if (messageTime === null || messageTime < lastReadTime) return false;
    if (messageTime > lastReadTime) return true;
    if (boundaryMessageIds === null) return false;
    return message.id == null || !boundaryMessageIds.has(String(message.id));
  });
};

export const mergeUnreadIncomingMessages = ({
  snapshotMessages,
  realtimeMessages,
  nickname,
  roomId
}) => {
  const merged = new Map();

  for (const message of [...(snapshotMessages || []), ...(realtimeMessages || [])]) {
    if (!message || message.sender === nickname || String(message.roomId) !== String(roomId)) continue;
    merged.set(getChatMessageKey(roomId, message), message);
  }

  return [...merged.values()];
};

export const resolveUnreadSnapshot = ({
  messages,
  nickname,
  lastReadCursor,
  previousSyncAt
}) => {
  const currentCursor = parseChatReadCursor(lastReadCursor);
  const isBootstrap = !currentCursor && !previousSyncAt;
  const bootstrapCursor = isBootstrap ? createChatReadCursor(messages) : null;
  const unreadMessages = isBootstrap
    ? []
    : currentCursor
      ? getUnreadIncomingMessages(messages, nickname, currentCursor)
      : (messages || []).filter((message) => message && message.sender !== nickname);
  const latestCursor = mergeChatReadCursors(
    currentCursor || bootstrapCursor,
    createChatReadCursor(messages)
  );

  return {
    isBootstrap,
    lastReadCursor: serializeChatReadCursor(currentCursor || bootstrapCursor),
    unreadMessages,
    unreadCount: unreadMessages.length,
    latestCursor: serializeChatReadCursor(latestCursor)
  };
};
