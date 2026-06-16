import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { useWebSocket } from '../../hooks/useWebSocket';
import { chatApi } from '../../api/chat';
import { getApiErrorMessage } from '../../api/errors';
import type { ChatMessage, RoomMember } from '../../api/types';
import { Avatar } from '../common/Avatar';
import {
  Send, Paperclip, MoreVertical, UserPlus, UserMinus,
  LogOut, Trash2, Check, CheckCheck, ChevronLeft,
  AlertCircle, Download, FileText, X, Users,
} from 'lucide-react';
import styles from './ChatArea.module.css';

export const ChatArea = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const activeRoomId = roomId ? parseInt(roomId, 10) : null;

  const { user } = useAuth();
  const navigate = useNavigate();

  const { messages, loading, loadingMore, hasMore, loadMoreMessages, addMessage, removeMessage } = useChat(activeRoomId, user?.id);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousScrollHeightRef = useRef<number>(0);

  const [messageText, setMessageText] = useState('');
  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState<string | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);
  const [adminActionSuccess, setAdminActionSuccess] = useState<string | null>(null);

  const [adminModal, setAdminModal] = useState<'ADD' | 'REMOVE' | null>(null);

  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberSearchResult, setMemberSearchResult] = useState<{ user_id: number; username: string; email: string } | null>(null);
  const [memberSearching, setMemberSearching] = useState(false);
  const [memberSearchError, setMemberSearchError] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  const [uploadingMedia, setUploadingMedia] = useState(false);

  const fetchRoomDetails = useCallback(async () => {
    if (!activeRoomId) return;
    try {
      const res = await chatApi.getRoomMembers(activeRoomId);
      if (res.status && res.members) {
        setRoomMembers(res.members);
        setIsGroup(res.is_group ?? false);
        if (res.group_name) setGroupName(res.group_name);
      }
    } catch { }
  }, [activeRoomId]);

  useEffect(() => {
    fetchRoomDetails();
    setMenuOpen(false);
    setDetailsPanelOpen(false);
    setAdminActionError(null);
    setAdminActionSuccess(null);
  }, [activeRoomId, fetchRoomDetails]);

  useEffect(() => {
    if (adminActionSuccess) {
      const timer = setTimeout(() => setAdminActionSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [adminActionSuccess]);

  useEffect(() => {
    if (adminActionError) {
      const timer = setTimeout(() => setAdminActionError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [adminActionError]);

  const closeAdminModal = () => {
    setAdminModal(null);
    setMemberSearchQuery('');
    setMemberSearchResult(null);
    setMemberSearchError(null);
    setAdminActionError(null);
  };

  const handleMemberSearch = async () => {
    if (!memberSearchQuery.trim()) return;
    setMemberSearching(true);
    setMemberSearchError(null);
    setMemberSearchResult(null);
    try {
      const res = await chatApi.searchUser(memberSearchQuery.trim());
      if (res.status) setMemberSearchResult(res);
    } catch {
      setMemberSearchError('User not found.');
    } finally {
      setMemberSearching(false);
    }
  };

  const handleIncomingMessage = useCallback(
  (incomingMsg: ChatMessage) => {
    console.log('room_id in msg:', incomingMsg.room_id, '| active room:', activeRoomId);
    if (!user) return;
    addMessage(incomingMsg);
    if (activeRoomId && incomingMsg.sender_id !== user.id && !incomingMsg.is_read) {
      chatApi.markSeen([incomingMsg.message_id]).catch(console.error);
    }
  },
  [addMessage, user, activeRoomId]
);

  const { sendMessage, status: wsStatus } = useWebSocket({ roomId: activeRoomId, onMessage: handleIncomingMessage });

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container || loadingMore || !hasMore) return;
    if (container.scrollTop <= 5) {
      previousScrollHeightRef.current = container.scrollHeight;
      loadMoreMessages();
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && previousScrollHeightRef.current > 0 && !loadingMore) {
      container.scrollTop = container.scrollHeight - previousScrollHeightRef.current;
      previousScrollHeightRef.current = 0;
    }
  }, [messages, loadingMore]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && previousScrollHeightRef.current === 0) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !user || !activeRoomId) return;
    const textToSend = messageText.trim();
    setMessageText('');
    if (!sendMessage(textToSend)) {
      setAdminActionError('Message could not be sent — connection offline.');
      setMessageText(textToSend);
    }
  };

  const handleAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeRoomId || !user) return;
    setUploadingMedia(true);
    setAdminActionError(null);
    try {
      const res = await chatApi.uploadMedia(file);
      if (res.status && res.file_url) {
        if (!sendMessage(res.file_url)) {
          setAdminActionError('Attachment uploaded, but could not be sent — connection offline.');
        }
      }
    } catch (err: unknown) {
      setAdminActionError(getApiErrorMessage(err, 'Media upload failed.'));
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddMember = async () => {
    if (!activeRoomId || !memberSearchResult) return;
    setSubmittingAction(true);
    setAdminActionError(null);
    setAdminActionSuccess(null);
    try {
      const res = await chatApi.addMember(activeRoomId, memberSearchResult.user_id);
      if (res.status) {
        setAdminActionSuccess(res.message || 'User added successfully!');
        closeAdminModal();
        fetchRoomDetails();
      }
    } catch (err: unknown) {
      setAdminActionError(getApiErrorMessage(err, 'Failed to add member. Admin only.'));
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!activeRoomId || !memberSearchResult) return;
    setSubmittingAction(true);
    setAdminActionError(null);
    setAdminActionSuccess(null);
    try {
      const res = await chatApi.removeMember(activeRoomId, memberSearchResult.user_id);
      if (res.status) {
        setAdminActionSuccess(res.message || 'User removed successfully!');
        closeAdminModal();
        fetchRoomDetails();
      }
    } catch (err: unknown) {
      setAdminActionError(getApiErrorMessage(err, 'Failed to remove member. Admin only.'));
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!activeRoomId) return;
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      const res = await chatApi.leaveGroup(activeRoomId);
      if (res.status) navigate('/inbox');
    } catch (err: unknown) {
      setAdminActionError(getApiErrorMessage(err, 'Failed to leave group.'));
    }
  };

  const handleDeleteGroup = async () => {
    if (!activeRoomId) return;
    if (!window.confirm('WARNING: Delete this group? Irreversible and admin-only.')) return;
    try {
      const res = await chatApi.deleteGroup(activeRoomId);
      if (res.status) navigate('/inbox');
    } catch (err: unknown) {
      setAdminActionError(getApiErrorMessage(err, 'Failed to delete group. Admin access required.'));
    }
  };

  const handleDeleteConversation = async () => {
    if (!activeRoomId) return;
    if (!window.confirm('Delete this conversation? This cannot be undone.')) return;
    try {
      const res = await chatApi.deleteConversation(activeRoomId);
      if (res.status) navigate('/inbox');
    } catch (err: unknown) {
      setAdminActionError(getApiErrorMessage(err, 'Failed to delete conversation.'));
    }
  };

  const handleDeleteMessage = async (msg: ChatMessage) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await chatApi.deleteMessage(msg.message_id);
      if (msg.message.includes("/media/")) {
        try { await chatApi.deleteMedia(msg.message); } catch { }
      }
      removeMessage(msg.message_id);
    } catch (err: unknown) {
      setAdminActionError(getApiErrorMessage(err, "Failed to delete message."));
    }
  };

  const isMediaUrl = (text: string) =>
    text.startsWith('http://') || text.startsWith('https://') || text.includes('/media/');

  const getMediaExtension = (url: string) => url.split('.').pop()?.toLowerCase() || '';

  const renderMediaMessage = (url: string) => {
    const ext = getMediaExtension(url);
    const imageExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
    const mediaBaseUrl = import.meta.env.VITE_MEDIA_BASE_URL || 'http://localhost:8000';
    const displayUrl = url.startsWith('/media/') ? `${mediaBaseUrl}${url}` : url;
    if (imageExtensions.includes(ext)) {
      return (
        <div className={styles.imageWrapper}>
          <img src={displayUrl} alt="Shared Image" className={styles.sharedImage} loading="lazy" />
          <a href={displayUrl} target="_blank" rel="noreferrer" className={styles.downloadMediaBtn}><Download size={14} /></a>
        </div>
      );
    }
    return (
      <div className={styles.fileLinkWrapper}>
        <FileText className={styles.fileIcon} size={28} />
        <div className={styles.fileMeta}>
          <span className={styles.fileName}>{url.split('/').pop() || 'Shared File'}</span>
          <span className={styles.fileSize}>Click to download</span>
        </div>
        <a href={displayUrl} target="_blank" rel="noreferrer" className={styles.fileDownloadBtn}><Download size={16} /></a>
      </div>
    );
  };

  const getChatHeaderName = () => {
    if (isGroup) return groupName || 'Group Chat';
    if (roomMembers.length > 0 && user) {
      const other = roomMembers.find(m => m.id !== user.id);
      if (other) return other.username;
    }
    return 'Synchronized Chat';
  };

  const getChatHeaderAvatarProps = () => {
    if (isGroup) return { isGroup: true };
    if (roomMembers.length > 0 && user) {
      const other = roomMembers.find(m => m.id !== user.id);
      if (other) return { username: other.username, userId: other.id };
    }
    return { username: 'Chat', userId: 0 };
  };

  if (!activeRoomId) {
    return <div className={styles.emptyContainer}><p>Select a chat room to view messages</p></div>;
  }

  return (
    <div className={styles.container}>

      {/* ───── Header ───── */}
      <header className={styles.chatHeader}>
        <button className={styles.backBtn} onClick={() => navigate('/inbox')}><ChevronLeft size={20} /></button>

        <div className={styles.headerInfo} onClick={() => setDetailsPanelOpen(true)}>
          <Avatar size={38} {...getChatHeaderAvatarProps()} />
          <div className={styles.chatTitleWrapper}>
            <h3 className={styles.chatTitle}>{getChatHeaderName()}</h3>
            <span className={styles.statusText}>
              {wsStatus === 'CONNECTED' ? <span className={styles.statusOnline}>Connected</span>
                : wsStatus === 'CONNECTING' ? <span className={styles.statusConnecting}>Reconnecting...</span>
                : <span className={styles.statusOffline}>Offline</span>}
            </span>
          </div>
        </div>

        <div className={styles.menuWrapper}>
          <button className={styles.menuTrigger} onClick={() => setMenuOpen(!menuOpen)}><MoreVertical size={20} /></button>
          {menuOpen && (
            <div className={styles.dropdownMenu}>
              <div className={styles.dropdownHeader}>Room Settings</div>
              {isGroup && (
                <>
                  <button onClick={() => { setAdminModal('ADD'); setMenuOpen(false); }} className={styles.dropdownItem}>
                    <UserPlus size={14} /><span>Add Member (Admin)</span>
                  </button>
                  <button onClick={() => { setAdminModal('REMOVE'); setMenuOpen(false); }} className={styles.dropdownItem}>
                    <UserMinus size={14} /><span>Remove Member (Admin)</span>
                  </button>
                  <button onClick={() => { setDetailsPanelOpen(true); setMenuOpen(false); }} className={styles.dropdownItem}>
                    <Users size={14} /><span>Group Info</span>
                  </button>
                  <button onClick={handleLeaveGroup} className={`${styles.dropdownItem} ${styles.dangerItem}`}>
                    <LogOut size={14} /><span>Leave Group</span>
                  </button>
                  <button onClick={handleDeleteGroup} className={`${styles.dropdownItem} ${styles.dangerItem}`}>
                    <Trash2 size={14} /><span>Delete Group (Admin)</span>
                  </button>
                </>
              )}
              {!isGroup && (
                <button onClick={() => { handleDeleteConversation(); setMenuOpen(false); }} className={`${styles.dropdownItem} ${styles.dangerItem}`}>
                  <Trash2 size={14} /><span>Delete Conversation</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ───── Banners ───── */}
      {adminActionError && (
        <div className={styles.bannerError}>
          <AlertCircle size={16} />
          <span>{adminActionError}</span>
          <button className={styles.bannerClose} onClick={() => setAdminActionError(null)}><X size={14} /></button>
        </div>
      )}
      {adminActionSuccess && (
        <div className={styles.bannerSuccess}>
          <Check size={16} />
          <span>{adminActionSuccess}</span>
          <button className={styles.bannerClose} onClick={() => setAdminActionSuccess(null)}><X size={14} /></button>
        </div>
      )}

      {/* ───── Messages ───── */}
      <div className={styles.messagesArea} ref={scrollContainerRef} onScroll={handleScroll}>
        {loading ? (
          <div className={styles.centeredState}><div className={styles.spinner}></div></div>
        ) : (
          <>
            {hasMore && (
              <div className={styles.loadMoreContainer}>
                {loadingMore ? <div className={styles.smallSpinner}></div> : <span className={styles.loadMoreText}>Scroll up to see history</span>}
              </div>
            )}
            {messages.length === 0 && <div className={styles.emptyMessages}><p>No messages in this chat yet. Say hello!</p></div>}
            {messages.map((msg) => {
              const isMine = user && msg.sender_id === user.id;
              const dateObj = new Date(msg.timestamp);
              const timeString = isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={msg.message_id} className={`${styles.messageRow} ${isMine ? styles.rowMine : styles.rowOther}`}>
                  <div className={`${styles.bubble} ${isMine ? styles.bubbleMine : styles.bubbleOther}`}>
                    {isMine && (
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteMessage(msg)}
                        title="Delete message"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                    <div className={styles.bubbleContent}>
                      {isMediaUrl(msg.message) ? renderMediaMessage(msg.message) : <p className={styles.messageText}>{msg.message}</p>}
                    </div>
                    <div className={styles.bubbleFooter}>
                      <span className={styles.timestamp}>{timeString}</span>
                      {isMine && (
                        <span className={styles.receipt}>
                          {msg.is_read ? <CheckCheck size={14} className={styles.seenCheck} /> : <Check size={14} className={styles.deliveredCheck} />}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ───── Input ───── */}
      <div className={styles.inputBar}>
        <form onSubmit={handleSend} className={styles.inputForm}>
          <button type="button" onClick={() => fileInputRef.current?.click()} className={styles.attachBtn} disabled={uploadingMedia}>
            <Paperclip size={18} />
          </button>
          <input type="file" ref={fileInputRef} onChange={handleAttachmentChange} style={{ display: 'none' }} />
          <input
            type="text"
            className={styles.chatInput}
            placeholder={uploadingMedia ? 'Uploading attachment...' : 'Type a secure message...'}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={uploadingMedia}
            maxLength={1000}
            required
          />
          <button type="submit" className={styles.sendBtn} disabled={!messageText.trim() || uploadingMedia}>
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* ───── Contact / Group Details Panel ───── */}
      {detailsPanelOpen && (
        <div className={styles.detailsOverlay} onClick={() => setDetailsPanelOpen(false)}>
          <div className={styles.detailsPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailsPanelHeader}>
              <span className={styles.detailsPanelTitle}>{isGroup ? 'Group Info' : 'Contact Info'}</span>
              <button className={styles.detailsCloseBtn} onClick={() => setDetailsPanelOpen(false)}><X size={20} /></button>
            </div>
            <div className={styles.detailsHero}>
              <Avatar size={80} {...getChatHeaderAvatarProps()} />
              <h2 className={styles.detailsName}>{getChatHeaderName()}</h2>

              {/* ✅ DM ke liye email show karo */}
              {!isGroup && user && (() => {
                const other = roomMembers.find(m => m.id !== user.id);
                return other?.email ? (
                  <p className={styles.detailsMemberCount}>{other.email}</p>
                ) : null;
              })()}

              {/* Group ke liye member count */}
              {isGroup && (
                <p className={styles.detailsMemberCount}>
                  {roomMembers.length} member{roomMembers.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            {isGroup && (
              <div className={styles.detailsSection}>
                <div className={styles.detailsSectionTitle}><Users size={14} /><span>Members ({roomMembers.length})</span></div>
                <div className={styles.membersList}>
                  {roomMembers.map((member) => (
                    <div key={member.id} className={styles.memberRow}>
                      <Avatar size={36} username={member.username} userId={member.id} />
                      <div className={styles.memberInfo}>
                        <span className={styles.memberName}>{member.username}</span>
                        {user && member.id === user.id && <span className={styles.memberYou}>You</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───── Add / Remove Member Modal ───── */}
      {adminModal && (
        <div className={styles.modalOverlay} onClick={closeAdminModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h4 className={styles.modalTitle}>
              {adminModal === 'ADD' ? 'Add Member to Group' : 'Remove Member from Group'}
            </h4>

            {adminActionError && (
              <div className={styles.modalError}><span>{adminActionError}</span></div>
            )}

            <div className={styles.modalForm}>
              <div className={styles.modalInputGroup}>
                <label className={styles.modalLabel}>Search Username</label>
                <div className={styles.searchRow}>
                  <input
                    type="text"
                    placeholder="Enter username..."
                    className={styles.modalInput}
                    value={memberSearchQuery}
                    onChange={(e) => { setMemberSearchQuery(e.target.value); setMemberSearchResult(null); setMemberSearchError(null); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleMemberSearch()}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleMemberSearch}
                    className={styles.searchBtn}
                    disabled={memberSearching}
                  >
                    {memberSearching ? '...' : 'Search'}
                  </button>
                </div>

                {memberSearchError && <p className={styles.searchError}>{memberSearchError}</p>}

                {memberSearchResult && (
                  <div className={styles.searchResult}>
                    <Avatar size={36} username={memberSearchResult.username} userId={memberSearchResult.user_id} />
                    <div className={styles.searchResultInfo}>
                      <span className={styles.searchResultName}>{memberSearchResult.username}</span>
                      <span className={styles.searchResultSub}>{memberSearchResult.email}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={closeAdminModal} className={styles.modalCancelBtn} disabled={submittingAction}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={adminModal === 'ADD' ? handleAddMember : handleRemoveMember}
                  className={styles.modalSubmitBtn}
                  disabled={!memberSearchResult || submittingAction}
                >
                  {submittingAction ? 'Executing...' : adminModal === 'ADD' ? 'Add Member' : 'Remove Member'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChatArea;