import { useCallback } from 'react';

export interface AuditLog {
  id: string;
  timestamp: string;
  actionType: string; // e.g., 'submit_listing', 'propose_lease', 'complete_payment', etc.
  userId?: string;
  userName?: string;
  details: any;
}

export function useAuditLogger() {
  const logAction = useCallback((
    actionType: string,
    details: any,
    userId?: string,
    userName?: string
  ) => {
    try {
      const stored = localStorage.getItem('sl_audit_logs');
      const currentLogs: AuditLog[] = stored ? JSON.parse(stored) : [];
      
      const newLog: AuditLog = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString(),
        actionType,
        userId,
        userName,
        details
      };

      // Retain latest 250 records to protect storage space
      const updated = [newLog, ...currentLogs].slice(0, 250);
      localStorage.setItem('sl_audit_logs', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to log admin audit action:', err);
    }
  }, []);

  const getLogs = useCallback((): AuditLog[] => {
    try {
      const stored = localStorage.getItem('sl_audit_logs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const clearLogs = useCallback(() => {
    try {
      localStorage.removeItem('sl_audit_logs');
    } catch (err) {
      console.error('Failed to clear admin audit logs:', err);
    }
  }, []);

  return {
    logAction,
    getLogs,
    clearLogs
  };
}
