import React, { useState } from 'react';
import './SettingsLogs.css';

// Dummy data for the logs
const initialLogs = [
  { id: 1, timestamp: '2026-03-12T13:45:00Z', user: 'System', event: 'ML Retrain', details: 'All models successfully trained', status: 'success' },
  { id: 2, timestamp: '2026-03-12T13:30:12Z', user: 'Admin User', event: 'Profile Update', details: 'Updated email address', status: 'success' },
  { id: 3, timestamp: '2026-03-12T12:15:00Z', user: 'System', event: 'API Sync', details: 'Failed to sync with billing provider', status: 'error' },
  { id: 4, timestamp: '2026-03-11T09:00:00Z', user: 'System', event: 'Daily Backup', details: 'Database backup completed', status: 'success' },
  { id: 5, timestamp: '2026-03-11T08:45:22Z', user: 'Jane Doe', event: 'Lead Assignment', details: 'Assigned lead #1042 to Jane', status: 'success' },
  { id: 6, timestamp: '2026-03-10T14:20:10Z', user: 'John Smith', event: 'Login', details: 'User logged in from IP 192.168.1.1', status: 'success' },
  { id: 7, timestamp: '2026-03-10T11:05:00Z', user: 'System', event: 'ML Retrain', details: 'Timeout reaching modeling service', status: 'error' },
];

const Logs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredLogs = initialLogs.filter((log) => {
    const matchesSearch = log.event.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
    }).format(date);
  };

  return (
    <div className="dashboard-content">
      <div className="section-header" style={{ marginBottom: '24px' }}>
        <h1 className="page-title">System Logs</h1>
        <p className="page-subtitle">Complete audit trail of system events and user activity.</p>
      </div>

      <div className="logs-container settings-card">
        {/* Logs Toolbar */}
        <div className="logs-toolbar">
          <div className="search-wrap">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Search logs by user, event, or details..." 
              className="form-input search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-wrap select-wrapper">
             <select 
               className="form-select" 
               value={filterStatus}
               onChange={(e) => setFilterStatus(e.target.value)}
             >
                <option value="all">All Statuses</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
             </select>
             <svg className="select-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
             </svg>
          </div>
          <button className="btn-outline export-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export CSV
          </button>
        </div>

        {/* Logs Table */}
        <div className="table-wrapper">
          <table className="logs-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User / System</th>
                <th>Event Type</th>
                <th>Details</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td className="log-time">{formatDate(log.timestamp)}</td>
                  <td className="log-user">
                    <span className={`user-badge ${log.user === 'System' ? 'system-badge' : ''}`}>
                      {log.user}
                    </span>
                  </td>
                  <td className="log-event">{log.event}</td>
                  <td className="log-details">{log.details}</td>
                  <td>
                    <span className={`status-badge ${log.status}`}>
                      {log.status === 'success' ? 'Success' : 'Failed'}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="no-logs">No logs found matching your criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Logs;
