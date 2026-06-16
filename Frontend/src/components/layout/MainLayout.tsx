import { useState } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Sidebar } from '../inbox/Sidebar';
import { Avatar } from '../common/Avatar';
import { ProfileModal } from '../profile/ProfileModal';
import { LogOut } from 'lucide-react';
import styles from './MainLayout.module.css';

export const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Determine if a chat room is currently active to adjust mobile layouts
  const isChatActive = !!roomId;

  return (
    <div className={`${styles.layoutContainer} ${isChatActive ? styles.chatActive : ''}`}>
      {/* Top Header */}
      <header className={styles.header}>
        <div className={styles.logoArea}>
          <span className={styles.logoText}>NexusChat</span>
        </div>

        <div className={styles.headerActions}>
          {user && (
            <div
              className={styles.profileTrigger}
              onClick={() => setProfileOpen(true)}
              title="Open Profile Settings"
            >
              <Avatar
                size={32}
                username={user.username}
                src={user.profilePic}
                userId={user.id}
              />
              <span className={styles.username}>{user.username}</span>
            </div>
          )}

          <button onClick={handleLogout} className={styles.logoutBtn} title="Sign Out">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Workspace split */}
      <div className={styles.mainArea}>
        <aside className={styles.sidebarWrapper}>
          <Sidebar />
        </aside>
        
        <main className={styles.contentWrapper}>
          <Outlet />
        </main>
      </div>

      {/* Profile Settings Modal */}
      {profileOpen && (
        <ProfileModal onClose={() => setProfileOpen(false)} />
      )}
    </div>
  );
};

export default MainLayout;
