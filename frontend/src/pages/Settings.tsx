import React, { useState } from 'react';
import { useToast } from '../components/common/Toast';
import { trainAllModels } from '../services/mlService';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import './SettingsLogs.css';

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  
  const [profile, setProfile] = useState({
    name: 'Admin User',
    email: 'admin@ourcrm.com',
  });

  const [preferences, setPreferences] = useState({
    language: i18n.language || 'en',
    theme: theme,
    notifications: true,
  });

  const [mlConfig, setMlConfig] = useState({
    churnThreshold: 50,
    autoRetrain: true,
  });

  const { showToast } = useToast();
  const [isTraining, setIsTraining] = useState(false);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePreferenceChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setPreferences({ ...preferences, [e.target.name]: value });
    
    // Provide immediate feedback for important changes like Language or Theme
    if (e.target.name === 'language') {
      i18n.changeLanguage(value as string);
      showToast(t('settings.language') + ' saved.', 'success');
    } else if (e.target.name === 'theme') {
      setTheme(value as any);
      showToast(t('settings.theme') + ' saved.', 'success');
    }
  };

  const handleMlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : Number(e.target.value);
    setMlConfig({ ...mlConfig, [e.target.name]: value });
  };

  const handleSaveProfile = () => {
    // Simulate API call to save user profile
    showToast(t('settings.saveProfile') + ' success!', 'success');
  };

  const handleForceRetrain = async () => {
    setIsTraining(true);
    showToast('Initiating global ML model retrain...', 'info');
    try {
      await trainAllModels();
      showToast('All ML models retrained successfully.', 'success');
    } catch (error) {
      showToast('Failed to retrain models.', 'error');
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="dashboard-content">
      <div className="section-header">
        <h1 className="page-title">{t('settings.title')}</h1>
        <p className="page-subtitle">{t('settings.subtitle')}</p>
      </div>

      <div className="settings-grid">
        {/* Profile Section */}
        <div className="settings-card">
          <div className="settings-card-header">
            <h3>{t('settings.profileInfo')}</h3>
          </div>
          <div className="settings-card-body">
            <div className="form-group">
              <label>{t('settings.fullName')}</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleProfileChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>{t('settings.emailAddress')}</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleProfileChange}
                className="form-input"
              />
            </div>
            <button 
              className="btn-primary" 
              style={{ marginTop: '16px' }}
              onClick={handleSaveProfile}
            >
              {t('settings.saveProfile')}
            </button>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="settings-card">
          <div className="settings-card-header">
            <h3>{t('settings.appPreferences')}</h3>
          </div>
          <div className="settings-card-body">
            <div className="form-group">
              <label>{t('settings.language')}</label>
              <div className="select-wrapper">
                <select name="language" value={preferences.language} onChange={handlePreferenceChange} className="form-select">
                  <option value="en">English (US)</option>
                  <option value="fr">Français (FR)</option>
                  <option value="es">Español (ES)</option>
                  <option value="de">Deutsch (DE)</option>
                </select>
                <svg className="select-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
            
            <div className="form-group">
              <label>{t('settings.theme')}</label>
              <div className="select-wrapper">
                <select name="theme" value={preferences.theme} onChange={handlePreferenceChange} className="form-select">
                  <option value="dark">Dark Theme (Premium)</option>
                  <option value="light">Light Theme</option>
                  <option value="system">System Default</option>
                </select>
                <svg className="select-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>

            <div className="form-toggle-group">
              <label className="toggle-label">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="toggle-title">{t('settings.emailNotifications')}</span>
                  <span className="toggle-desc">Receive daily summary reports and alerts.</span>
                </div>
                <input
                  type="checkbox"
                  name="notifications"
                  checked={preferences.notifications}
                  onChange={handlePreferenceChange}
                  className="toggle-checkbox"
                />
                <div className="toggle-switch"></div>
              </label>
            </div>
          </div>
        </div>

        {/* AI & ML Configuration Section */}
        <div className="settings-card">
          <div className="settings-card-header">
            <h3>{t('settings.mlConfig')}</h3>
          </div>
          <div className="settings-card-body">
            <div className="form-group">
              <label className="flex-label">
                <span>{t('settings.churnThreshold')}</span>
                <span className="badge-value">{mlConfig.churnThreshold}%</span>
              </label>
              <input
                type="range"
                name="churnThreshold"
                min="0"
                max="100"
                value={mlConfig.churnThreshold}
                onChange={handleMlChange}
                className="form-range"
              />
              <p className="setting-help">Accounts with a churn risk above this threshold will be flagged in red.</p>
            </div>

            <div className="form-toggle-group" style={{ marginTop: '24px' }}>
              <label className="toggle-label">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="toggle-title">{t('settings.autoRetrain')}</span>
                  <span className="toggle-desc">Automatically update predictive models every 7 days.</span>
                </div>
                <input
                  type="checkbox"
                  name="autoRetrain"
                  checked={mlConfig.autoRetrain}
                  onChange={handleMlChange}
                  className="toggle-checkbox"
                />
                <div className="toggle-switch"></div>
              </label>
            </div>
            <button 
              className="btn-outline" 
              style={{ marginTop: '24px', width: '100%', opacity: isTraining ? 0.7 : 1 }}
              onClick={handleForceRetrain}
              disabled={isTraining}
            >
              {isTraining ? 'Training Models...' : t('settings.forceRetrain')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
