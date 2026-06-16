import { Users, User } from 'lucide-react';
import styles from './Avatar.module.css';

interface AvatarProps {
  username?: string;
  src?: string | null;
  size?: number;
  isGroup?: boolean;
  userId?: number;
}

// Tailored rich gradient list for initials background
const GRADIENTS = [
  'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)', // Indigo -> Cyan
  'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)', // Pink -> Rose
  'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Emerald -> Green
  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', // Amber -> Yellow
  'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', // Purple -> Pink
  'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', // Blue -> Dark Blue
];

export const Avatar = ({ username = '', src, size = 40, isGroup = false, userId = 0 }: AvatarProps) => {
  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const getGradient = (id: number) => {
    const index = id % GRADIENTS.length;
    return GRADIENTS[index];
  };

  const mediaBaseUrl = import.meta.env.VITE_MEDIA_BASE_URL || 'http://localhost:8000';
  
  // Format the image source URL
  const imageUrl = src
    ? src.startsWith('http')
      ? src
      : `${mediaBaseUrl}${src}`
    : null;

  const initials = getInitials(username);
  const background = getGradient(userId);

  return (
    <div
      className={styles.avatar}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${size * 0.4}px`,
        background: imageUrl ? 'transparent' : isGroup ? 'var(--bg-tertiary)' : background,
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={username}
          className={styles.image}
          onError={(e) => {
            // If image fails to load, fallback to initials/icon
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : isGroup ? (
        <Users size={size * 0.5} className={styles.icon} />
      ) : username ? (
        <span className={styles.initials}>{initials}</span>
      ) : (
        <User size={size * 0.5} className={styles.icon} />
      )}
    </div>
  );
};

export default Avatar;
