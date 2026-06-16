import React, { useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { profileApi } from '../../api/profile';
import { getApiErrorMessage } from '../../api/errors';
import { Avatar } from '../common/Avatar';
import { X, Upload, Trash2, Edit2, Check, AlertCircle } from 'lucide-react';
import styles from './ProfileModal.module.css';

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal = ({ onClose }: ProfileModalProps) => {
  const { user, refreshProfile } = useAuth();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [bioText, setBioText] = useState(user?.bio || '');
  const [editingBio, setEditingBio] = useState(false);
  const [submittingPic, setSubmittingPic] = useState(false);
  const [submittingBio, setSubmittingBio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const mediaBaseUrl = import.meta.env.VITE_MEDIA_BASE_URL || 'http://localhost:8000';
  const fullPicUrl = user?.profilePic
    ? user.profilePic.startsWith('http')
      ? user.profilePic
      : `${mediaBaseUrl}${user.profilePic}`
    : null;

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setSubmittingPic(true);

    try {
      const profileExists = !!(user?.profilePic || user?.bio);
      
      let res;
      if (profileExists) {
        res = await profileApi.updateProfilePic(file);
      } else {
        res = await profileApi.uploadProfilePic(file);
      }

      if (res.status) {
        await refreshProfile();
        setSuccessMsg('Profile picture updated successfully!');
      } else {
        setError('Failed to upload profile picture.');
      }
    } catch (err: unknown) {
      console.error('File upload error:', err);
      setError(getApiErrorMessage(err, 'Error uploading profile picture. Ensure the file type is correct.'));
    } finally {
      setSubmittingPic(false);
    }
  };

  const handleDeletePic = async () => {
    setError(null);
    setSuccessMsg(null);
    setSubmittingPic(true);

    try {
      const res = await profileApi.deleteProfilePic();
      if (res.status) {
        await refreshProfile();
        setSuccessMsg('Profile picture deleted.');
      } else {
        setError('Failed to delete profile picture.');
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error deleting profile picture.'));
    } finally {
      setSubmittingPic(false);
    }
  };

  const handleSaveBio = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmittingBio(true);

    try {
      const profileExists = !!(user?.profilePic || user?.bio);
      if (!profileExists) {
        setError('You must upload a profile picture first to create your profile before saving a bio.');
        setSubmittingBio(false);
        return;
      }

      const res = await profileApi.uploadBio(bioText);
      if (res.status) {
        await refreshProfile();
        setEditingBio(false);
        setSuccessMsg('Biography updated!');
      } else {
        setError('Failed to save bio.');
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error saving bio.'));
    } finally {
      setSubmittingBio(false);
    }
  };

  const handleDeleteBio = async () => {
    setError(null);
    setSuccessMsg(null);
    setSubmittingBio(true);

    try {
      const res = await profileApi.deleteBio();
      if (res.status) {
        await refreshProfile();
        setBioText('');
        setEditingBio(false);
        setSuccessMsg('Biography removed.');
      } else {
        setError('Failed to remove bio.');
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error removing bio.'));
    } finally {
      setSubmittingBio(false);
    }
  };

  return (
    <>
      {/* Lightbox */}
      {lightboxOpen && fullPicUrl && (
        <div className={styles.lightboxOverlay} onClick={() => setLightboxOpen(false)}>
          <button className={styles.lightboxClose} onClick={() => setLightboxOpen(false)}>
            <X size={24} />
          </button>
          <img
            src={fullPicUrl}
            alt="Profile"
            className={styles.lightboxImage}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.content} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className={styles.header}>
            <h2 className={styles.title}>My Profile Settings</h2>
            <button className={styles.closeBtn} onClick={onClose} title="Close">
              <X size={20} />
            </button>
          </div>

          {/* Messaging banners */}
          {error && (
            <div className={styles.bannerError}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className={styles.bannerSuccess}>
              <Check size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          <div className={styles.body}>
            {/* Avatar Area */}
            <div className={styles.avatarSection}>
              <div
                className={styles.avatarWrapper}
                onClick={() => fullPicUrl && setLightboxOpen(true)}
                style={{ cursor: fullPicUrl ? 'pointer' : 'default' }}
                title={fullPicUrl ? 'Click to view full size' : undefined}
              >
                <Avatar
                  size={96}
                  username={user?.username}
                  src={user?.profilePic}
                  userId={user?.id}
                />
                {submittingPic && <div className={styles.avatarSpinner}></div>}
              </div>

              <div className={styles.avatarActions}>
                <button
                  type="button"
                  onClick={triggerFileSelect}
                  className={styles.uploadBtn}
                  disabled={submittingPic}
                >
                  <Upload size={14} />
                  <span>Upload Pic</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                
                {user?.profilePic && (
                  <button
                    type="button"
                    onClick={handleDeletePic}
                    className={styles.deleteBtn}
                    disabled={submittingPic}
                    title="Remove Profile Picture"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <p className={styles.profileHint}>
                {!user?.profilePic && 'Upload a picture first to initialize your chat profile.'}
              </p>
            </div>

            <hr className={styles.separator} />

            {/* Biography Area */}
            <div className={styles.bioSection}>
              <div className={styles.bioHeader}>
                <h4 className={styles.bioTitle}>Biography</h4>
                {!editingBio && (
                  <button
                    onClick={() => setEditingBio(true)}
                    className={styles.editBioBtn}
                    title="Edit Biography"
                  >
                    <Edit2 size={14} />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {editingBio ? (
                <form onSubmit={handleSaveBio} className={styles.bioForm}>
                  <textarea
                    className={styles.bioTextarea}
                    placeholder="Tell others about yourself..."
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    disabled={submittingBio}
                    maxLength={250}
                    required
                    autoFocus
                  />
                  <div className={styles.bioActions}>
                    {user?.bio && (
                      <button
                        type="button"
                        onClick={handleDeleteBio}
                        className={styles.deleteBioBtn}
                        disabled={submittingBio}
                      >
                        Remove
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setBioText(user?.bio || '');
                        setEditingBio(false);
                      }}
                      className={styles.cancelBioBtn}
                      disabled={submittingBio}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={styles.saveBioBtn}
                      disabled={submittingBio}
                    >
                      {submittingBio ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              ) : (
                <p className={styles.bioDisplay}>
                  {user?.bio ? user.bio : 'No biography set. Click Edit to add one.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileModal;