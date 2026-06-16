import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { profileApi } from '../api/profile';
import { getApiErrorMessage } from '../api/errors';
import { Avatar } from '../components/common/Avatar';
import { ArrowLeft, Upload, Trash2, Edit2, Check, AlertCircle } from 'lucide-react';
import styles from './Profile.module.css';

export const Profile = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bioText, setBioText] = useState(user?.bio || '');
  const [editingBio, setEditingBio] = useState(false);
  const [submittingPic, setSubmittingPic] = useState(false);
  const [submittingBio, setSubmittingBio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
      setError(getApiErrorMessage(err, 'Error uploading profile picture.'));
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
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error removing bio.'));
    } finally {
      setSubmittingBio(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageCard}>
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/inbox')} title="Back to Inbox">
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          <h2 className={styles.title}>Account Settings</h2>
        </div>

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
          {/* Avatar Section */}
          <div className={styles.avatarSection}>
            <div className={styles.avatarWrapper}>
              <Avatar
                size={110}
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
                <span>Upload Photo</span>
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
                  title="Remove Photo"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <p className={styles.profileHint}>
              {!user?.profilePic && 'An avatar picture initializes your profile on the network.'}
            </p>
          </div>

          {/* User Meta Information */}
          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Username</span>
              <span className={styles.infoValue}>{user?.username}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Email Address</span>
              <span className={styles.infoValue}>{user?.email}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>User ID</span>
              <span className={styles.infoValue}>{user?.id}</span>
            </div>
          </div>

          <hr className={styles.divider} />

          {/* Bio Form */}
          <div className={styles.bioSection}>
            <div className={styles.bioHeader}>
              <h4 className={styles.bioTitle}>Biography</h4>
              {!editingBio && (
                <button
                  onClick={() => setEditingBio(true)}
                  className={styles.editBioBtn}
                  title="Edit biography text"
                >
                  <Edit2 size={12} />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {editingBio ? (
              <form onSubmit={handleSaveBio} className={styles.bioForm}>
                <textarea
                  className={styles.bioTextarea}
                  placeholder="Share a brief bio with your contacts..."
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
                      Delete
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
              <p className={styles.bioText}>
                {user?.bio ? user.bio : 'No biography set yet. Add one to let others know you.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
