import  { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { chatApi } from '../../api/chat';
import type { SearchGroupResult } from '../../api/chat';
import { getApiErrorMessage } from '../../api/errors';
import type { InboxItem, RoomMember } from '../../api/types';
import { Avatar } from '../common/Avatar';
import { Users, UserPlus, MessageSquare, Search, X } from 'lucide-react';
import styles from './Sidebar.module.css';

export const Sidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const activeRoomId = roomId ? parseInt(roomId, 10) : null;

  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'groups'>('chats');

  const membersCacheRef = useRef<Record<number, RoomMember[]>>({});
  const [membersCache, setMembersCache] = useState<Record<number, RoomMember[]>>({});

  const [activeModal, setActiveModal] = useState<'DM' | 'CREATE_GROUP' | 'JOIN_GROUP' | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const [dmQuery, setDmQuery] = useState('');
  const [dmSearchResult, setDmSearchResult] = useState<{ user_id: number; username: string; email: string } | null>(null);
  const [dmSearching, setDmSearching] = useState(false);
  const [dmSearchError, setDmSearchError] = useState<string | null>(null);

  const [groupName, setGroupName] = useState('');
  const [groupMemberQuery, setGroupMemberQuery] = useState('');
  const [groupMemberSearchResult, setGroupMemberSearchResult] = useState<{ user_id: number; username: string; email: string } | null>(null);
  const [groupMemberSearching, setGroupMemberSearching] = useState(false);
  const [groupMemberSearchError, setGroupMemberSearchError] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<{ user_id: number; username: string }[]>([]);

  const [joinQuery, setJoinQuery] = useState('');
  const [joinResults, setJoinResults] = useState<SearchGroupResult[]>([]);
  const [joinSearching, setJoinSearching] = useState(false);
  const [joinSearchError, setJoinSearchError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<SearchGroupResult | null>(null);

  const fetchInbox = useCallback(async () => {
    try {
      const items = await chatApi.getInbox();
      setInboxItems(items);
      items.forEach(async (item) => {
        if (!membersCacheRef.current[item.room_id]) {
          try {
            const res = await chatApi.getRoomMembers(item.room_id);
            if (res.status && res.members) {
              membersCacheRef.current[item.room_id] = res.members;
              setMembersCache(prev => ({ ...prev, [item.room_id]: res.members }));
            }
          } catch { }
        }
      });
    } catch (err) {
      console.error('Failed to load inbox:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInbox();
    const interval = setInterval(fetchInbox, 10000);
    return () => clearInterval(interval);
  }, [fetchInbox]);

  const closeModal = () => {
    setActiveModal(null);
    setModalError(null);
    setDmQuery('');
    setDmSearchResult(null);
    setDmSearchError(null);
    setGroupName('');
    setGroupMemberQuery('');
    setGroupMemberSearchResult(null);
    setGroupMemberSearchError(null);
    setGroupMembers([]);
    setJoinQuery('');
    setJoinResults([]);
    setJoinSearchError(null);
    setSelectedGroup(null);
  };

  const handleDmSearch = async () => {
    if (!dmQuery.trim()) return;
    setDmSearching(true);
    setDmSearchError(null);
    setDmSearchResult(null);
    try {
      const res = await chatApi.searchUser(dmQuery.trim());
      if (res.status) setDmSearchResult(res);
    } catch {
      setDmSearchError('User not found.');
    } finally {
      setDmSearching(false);
    }
  };

  const handleCreateDM = async () => {
    if (!dmSearchResult) return;
    setModalSubmitting(true);
    setModalError(null);
    try {
      const res = await chatApi.getPrivateRoom(dmSearchResult.user_id);
      closeModal();
      fetchInbox();
      navigate(`/chat/${res.room_id}`);
    } catch (err: unknown) {
      setModalError(getApiErrorMessage(err, 'Failed to start private chat.'));
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleGroupMemberSearch = async () => {
    if (!groupMemberQuery.trim()) return;
    setGroupMemberSearching(true);
    setGroupMemberSearchError(null);
    setGroupMemberSearchResult(null);
    try {
      const res = await chatApi.searchUser(groupMemberQuery.trim());
      if (res.status) {
        if (groupMembers.find(m => m.user_id === res.user_id)) {
          setGroupMemberSearchError('User already added.');
        } else {
          setGroupMemberSearchResult(res);
        }
      }
    } catch {
      setGroupMemberSearchError('User not found.');
    } finally {
      setGroupMemberSearching(false);
    }
  };

  const addGroupMember = () => {
    if (!groupMemberSearchResult) return;
    setGroupMembers(prev => [...prev, { user_id: groupMemberSearchResult.user_id, username: groupMemberSearchResult.username }]);
    setGroupMemberSearchResult(null);
    setGroupMemberQuery('');
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setModalError('Group name is required.');
      return;
    }
    if (groupMembers.length === 0) {
      setModalError('At least one member required.');
      return;
    }
    setModalSubmitting(true);
    setModalError(null);
    try {
      const res = await chatApi.createGroup(groupMembers.map(m => m.user_id), groupName.trim());
      closeModal();
      fetchInbox();
      navigate(`/chat/${res.room_id}`);
    } catch (err: unknown) {
      setModalError(getApiErrorMessage(err, 'Failed to create group.'));
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleJoinSearch = async () => {
    if (!joinQuery.trim()) return;
    setJoinSearching(true);
    setJoinSearchError(null);
    setJoinResults([]);
    setSelectedGroup(null);
    try {
      const res = await chatApi.searchGroup(joinQuery.trim());
      if (res.status && res.groups.length > 0) {
        setJoinResults(res.groups);
      } else {
        setJoinSearchError('No groups found.');
      }
    } catch {
      setJoinSearchError('No groups found.');
    } finally {
      setJoinSearching(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!selectedGroup) return;
    setModalSubmitting(true);
    setModalError(null);
    try {
      const res = await chatApi.joinGroup(selectedGroup.group_id);
      closeModal();
      fetchInbox();
      navigate(`/chat/${res.room_id}`);
    } catch (err: unknown) {
      setModalError(getApiErrorMessage(err, 'Failed to join group.'));
    } finally {
      setModalSubmitting(false);
    }
  };

  const getRoomName = (item: InboxItem) => {
    const members = membersCache[item.room_id];
    if (item.is_group) {
      return item.group_name || `Group Chat #${item.room_id}`;
    }
    if (members && user) {
      const otherUser = members.find(m => m.id !== user.id);
      if (otherUser) return otherUser.username;
    }
    if (user) {
      const otherId = item.rec_id.find(id => id !== user.id);
      if (otherId) return `User #${otherId}`;
    }
    return item.rec_id.length > 0 ? `User #${item.rec_id[0]}` : `Room #${item.room_id}`;
  };

  const getRoomAvatarProps = (item: InboxItem) => {
    const members = membersCache[item.room_id];
    if (item.is_group) return { isGroup: true };
    if (members && user) {
      const otherUser = members.find(m => m.id !== user.id);
      if (otherUser) return { username: otherUser.username, userId: otherUser.id };
    }
    if (user) {
      const otherId = item.rec_id.find(id => id !== user.id) || item.rec_id[0] || 0;
      return { username: `User #${otherId}`, userId: otherId };
    }
    return { username: 'Chat', userId: 0 };
  };

  const filteredInbox = inboxItems.filter((item) => {
    const roomName = getRoomName(item).toLowerCase();
    const lastMsg = (item.message || '').toLowerCase();
    const matchesSearch = roomName.includes(searchQuery.toLowerCase()) || lastMsg.includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'chats' ? !item.is_group : item.is_group;
    return matchesSearch && matchesTab;
  });

  return (
    <div className={styles.container}>
      <div className={styles.searchContainer}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search conversations..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.actionGrid}>
        <button onClick={() => { setActiveModal('DM'); setModalError(null); }} className={styles.actionBtn}>
          <MessageSquare size={16} />
          <span>New DM</span>
        </button>
        <button onClick={() => { setActiveModal('CREATE_GROUP'); setModalError(null); }} className={styles.actionBtn}>
          <Users size={16} />
          <span>New Group</span>
        </button>
        <button onClick={() => { setActiveModal('JOIN_GROUP'); setModalError(null); }} className={styles.actionBtn}>
          <UserPlus size={16} />
          <span>Join Group</span>
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'chats' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('chats')}
        >
          <MessageSquare size={14} />
          Chats
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'groups' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          <Users size={14} />
          Groups
        </button>
      </div>

      <div className={styles.listContainer}>
        {loading ? (
          <div className={styles.centeredState}><div className={styles.spinner}></div></div>
        ) : filteredInbox.length === 0 ? (
          <div className={styles.centeredState}>
            <p className={styles.emptyText}>
              {activeTab === 'chats' ? 'No chats found' : 'No groups found'}
            </p>
          </div>
        ) : (
          filteredInbox.map((item) => {
            const isActive = activeRoomId === item.room_id;
            const avatarProps = getRoomAvatarProps(item);
            return (
              <div
                key={item.room_id}
                onClick={() => navigate(`/chat/${item.room_id}`)}
                className={`${styles.inboxItem} ${isActive ? styles.activeItem : ''}`}
              >
                <Avatar size={44} {...avatarProps} />
                <div className={styles.itemMeta}>
                  <div className={styles.itemHeader}>
                    <span className={styles.roomName}>{getRoomName(item)}</span>
                  </div>
                  <p className={styles.lastMessage}>{item.message || 'No messages yet'}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {activeModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>
              {activeModal === 'DM' && 'Start Private DM'}
              {activeModal === 'CREATE_GROUP' && 'Create Group Chat'}
              {activeModal === 'JOIN_GROUP' && 'Join Group Chat'}
            </h3>

            {modalError && <div className={styles.modalError}><span>{modalError}</span></div>}

            {/* DM Modal */}
            {activeModal === 'DM' && (
              <div className={styles.modalForm}>
                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Search Username</label>
                  <div className={styles.searchRow}>
                    <input
                      type="text"
                      placeholder="Enter username..."
                      className={styles.modalInput}
                      value={dmQuery}
                      onChange={(e) => { setDmQuery(e.target.value); setDmSearchResult(null); setDmSearchError(null); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleDmSearch()}
                      autoFocus
                    />
                    <button onClick={handleDmSearch} className={styles.searchBtn} disabled={dmSearching}>
                      {dmSearching ? '...' : 'Search'}
                    </button>
                  </div>
                  {dmSearchError && <p className={styles.searchError}>{dmSearchError}</p>}
                  {dmSearchResult && (
                    <div className={styles.searchResult}>
                      <Avatar size={36} username={dmSearchResult.username} userId={dmSearchResult.user_id} />
                      <div className={styles.searchResultInfo}>
                        <span className={styles.searchResultName}>{dmSearchResult.username}</span>
                        <span className={styles.searchResultSub}>{dmSearchResult.email}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className={styles.modalActions}>
                  <button onClick={closeModal} className={styles.modalCancelBtn}>Cancel</button>
                  <button onClick={handleCreateDM} className={styles.modalSubmitBtn} disabled={!dmSearchResult || modalSubmitting}>
                    {modalSubmitting ? 'Opening...' : 'Start Chat'}
                  </button>
                </div>
              </div>
            )}

            {/* Create Group Modal */}
            {activeModal === 'CREATE_GROUP' && (
              <div className={styles.modalForm}>
                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Group Name</label>
                  <input
                    type="text"
                    placeholder="Enter group name..."
                    className={styles.modalInput}
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Add Members</label>
                  <div className={styles.searchRow}>
                    <input
                      type="text"
                      placeholder="Search username..."
                      className={styles.modalInput}
                      value={groupMemberQuery}
                      onChange={(e) => { setGroupMemberQuery(e.target.value); setGroupMemberSearchResult(null); setGroupMemberSearchError(null); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleGroupMemberSearch()}
                    />
                    <button onClick={handleGroupMemberSearch} className={styles.searchBtn} disabled={groupMemberSearching}>
                      {groupMemberSearching ? '...' : 'Search'}
                    </button>
                  </div>
                  {groupMemberSearchError && <p className={styles.searchError}>{groupMemberSearchError}</p>}
                  {groupMemberSearchResult && (
                    <div className={styles.searchResult}>
                      <Avatar size={36} username={groupMemberSearchResult.username} userId={groupMemberSearchResult.user_id} />
                      <div className={styles.searchResultInfo}>
                        <span className={styles.searchResultName}>{groupMemberSearchResult.username}</span>
                        <span className={styles.searchResultSub}>{groupMemberSearchResult.email}</span>
                      </div>
                      <button onClick={addGroupMember} className={styles.addMemberBtn}>Add</button>
                    </div>
                  )}
                  {groupMembers.length > 0 && (
                    <div className={styles.membersList}>
                      {groupMembers.map(m => (
                        <div key={m.user_id} className={styles.memberChip}>
                          <span>{m.username}</span>
                          <button onClick={() => setGroupMembers(prev => prev.filter(x => x.user_id !== m.user_id))} className={styles.chipRemove}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <small className={styles.modalHelp}>You will be added as group owner automatically.</small>
                </div>

                <div className={styles.modalActions}>
                  <button onClick={closeModal} className={styles.modalCancelBtn}>Cancel</button>
                  <button onClick={handleCreateGroup} className={styles.modalSubmitBtn} disabled={groupMembers.length === 0 || !groupName.trim() || modalSubmitting}>
                    {modalSubmitting ? 'Creating...' : 'Create Group'}
                  </button>
                </div>
              </div>
            )}

            {/* Join Group Modal */}
            {activeModal === 'JOIN_GROUP' && (
              <div className={styles.modalForm}>
                <div className={styles.modalInputGroup}>
                  <label className={styles.modalLabel}>Search Group Name</label>
                  <div className={styles.searchRow}>
                    <input
                      type="text"
                      placeholder="Enter group name..."
                      className={styles.modalInput}
                      value={joinQuery}
                      onChange={(e) => { setJoinQuery(e.target.value); setJoinResults([]); setJoinSearchError(null); setSelectedGroup(null); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleJoinSearch()}
                      autoFocus
                    />
                    <button onClick={handleJoinSearch} className={styles.searchBtn} disabled={joinSearching}>
                      {joinSearching ? '...' : 'Search'}
                    </button>
                  </div>
                  {joinSearchError && <p className={styles.searchError}>{joinSearchError}</p>}
                  {joinResults.length > 0 && (
                    <div className={styles.joinResultsList}>
                      {joinResults.map(g => (
                        <div
                          key={g.group_id}
                          className={`${styles.joinResultItem} ${selectedGroup?.group_id === g.group_id ? styles.joinResultSelected : ''}`}
                          onClick={() => setSelectedGroup(g)}
                        >
                          <Avatar size={36} isGroup={true} />
                          <div className={styles.searchResultInfo}>
                            <span className={styles.searchResultName}>{g.name}</span>
                            <span className={styles.searchResultSub}>{g.members_count} members · by {g.created_by}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.modalActions}>
                  <button onClick={closeModal} className={styles.modalCancelBtn}>Cancel</button>
                  <button onClick={handleJoinGroup} className={styles.modalSubmitBtn} disabled={!selectedGroup || modalSubmitting}>
                    {modalSubmitting ? 'Joining...' : 'Join Group'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;