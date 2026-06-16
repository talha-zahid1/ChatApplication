import { MessageSquare, ShieldCheck, Heart } from 'lucide-react';
import styles from './Inbox.module.css';

export const Inbox = () => {
  return (
    <div className={styles.container}>
      <div className={styles.welcomeCard}>
        <div className={styles.iconCircle}>
          <MessageSquare size={36} className={styles.chatIcon} />
        </div>
        
        <h2 className={styles.title}>Your Secure Inbox</h2>
        <p className={styles.subtitle}>
          Select a contact from the sidebar or click "New DM" to initiate a secure, end-to-end synchronized chat session.
        </p>

        <div className={styles.badgeRow}>
          <div className={styles.badge}>
            <ShieldCheck size={14} />
            <span>Secure Auth</span>
          </div>
          <div className={styles.badge}>
            <Heart size={14} />
            <span>Premium UI</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inbox;
