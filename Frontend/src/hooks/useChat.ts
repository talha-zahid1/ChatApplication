import { useState, useEffect, useCallback, useRef } from 'react';
import { chatApi } from '../api/chat';
import { getApiErrorMessage } from '../api/errors';
import type { ChatMessage } from '../api/types';

export const useChat = (roomId: number | null, currentUserId: number | undefined) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const roomIdRef = useRef<number | null>(roomId);
  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  const loadInitialMessages = useCallback(async () => {
    if (!roomId) {
      setMessages([]);
      setNextCursor(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await chatApi.getMessages(roomId);
      if (roomIdRef.current !== roomId) return;

      const reversed = [...data.results].reverse();
      setMessages(reversed);
      setNextCursor(data.next);

      if (currentUserId) {
        const unreadIds = data.results
          .filter((msg) => !msg.is_read && msg.sender_id !== currentUserId)
          .map((msg) => msg.message_id);

        if (unreadIds.length > 0) {
          try {
            await chatApi.markSeen(unreadIds);
            setMessages((prev) =>
              prev.map((msg) =>
                unreadIds.includes(msg.message_id) ? { ...msg, is_read: true } : msg
              )
            );
          } catch (err) {
            console.error('Failed to mark messages as seen:', err);
          }
        }
      }
    } catch (err: unknown) {
      if (roomIdRef.current === roomId) {
        setError(getApiErrorMessage(err, 'Failed to load messages.'));
      }
    } finally {
      if (roomIdRef.current === roomId) {
        setLoading(false);
      }
    }
  }, [roomId, currentUserId]);

  const loadMoreMessages = useCallback(async () => {
    if (!roomId || !nextCursor || loadingMore) return;

    setLoadingMore(true);
    try {
      const data = await chatApi.getMessages(roomId, nextCursor);
      if (roomIdRef.current !== roomId) return;

      const reversedOlder = [...data.results].reverse();
      setMessages((prev) => [...reversedOlder, ...prev]);
      setNextCursor(data.next);

      if (currentUserId) {
        const unreadIds = data.results
          .filter((msg) => !msg.is_read && msg.sender_id !== currentUserId)
          .map((msg) => msg.message_id);

        if (unreadIds.length > 0) {
          try {
            await chatApi.markSeen(unreadIds);
          } catch (err) {
            console.error('Failed to mark seen on pagination:', err);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load older messages:', err);
    } finally {
      if (roomIdRef.current === roomId) {
        setLoadingMore(false);
      }
    }
  }, [roomId, nextCursor, loadingMore, currentUserId]);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.message_id === message.message_id)) return prev;
      return [...prev, message];
    });
  }, []);

  const markMessageAsRead = useCallback((messageId: number) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.message_id === messageId ? { ...msg, is_read: true } : msg))
    );
  }, []);

  // ✅ Message ko local state se remove karo
  const removeMessage = useCallback((messageId: number) => {
    setMessages((prev) => prev.filter((msg) => msg.message_id !== messageId));
  }, []);

  useEffect(() => {
    loadInitialMessages();
  }, [roomId, loadInitialMessages]);

  return {
    messages,
    loading,
    loadingMore,
    hasMore: !!nextCursor,
    error,
    loadMoreMessages,
    addMessage,
    markMessageAsRead,
    removeMessage, // ✅ export
    reload: loadInitialMessages,
  };
};