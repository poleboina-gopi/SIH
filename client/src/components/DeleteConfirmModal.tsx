import React from 'react';
import { Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  itemName?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title = "Delete Inspection",
  message = "Are you sure you want to delete this inspection?",
  itemName,
  isDeleting = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '460px',
        width: '100%',
        background: '#0f172a',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444'
          }}>
            <Trash2 size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              {title}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Statutory Record Deletion
            </p>
          </div>
        </div>

        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '10px',
          padding: '14px',
          marginBottom: '20px'
        }}>
          <p style={{ fontSize: '0.95rem', color: '#fca5a5', fontWeight: 600, margin: 0 }}>
            {message}
          </p>
          {itemName && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '6px 0 0' }}>
              Target: <span style={{ color: '#ffffff', fontWeight: 600 }}>{itemName}</span>
            </p>
          )}
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '8px 0 0' }}>
            This will permanently remove the uploaded image, OCR text, compliance validation results, and database records.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="btn btn-secondary"
            style={{ padding: '10px 18px', fontSize: '0.88rem' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              padding: '10px 18px',
              fontSize: '0.88rem',
              fontWeight: 700,
              borderRadius: '8px',
              border: 'none',
              background: '#ef4444',
              color: '#ffffff',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: isDeleting ? 0.7 : 1
            }}
          >
            {isDeleting ? (
              <>Deleting...</>
            ) : (
              <>
                <Trash2 size={16} />
                Confirm Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
