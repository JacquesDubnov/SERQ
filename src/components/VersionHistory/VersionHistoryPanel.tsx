/**
 * Version History Panel
 * Full-screen modal showing version timeline with preview and restore
 */
import { useEffect, useCallback, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { useVersionHistory } from '../../hooks/useVersionHistory';
import { VersionPreview } from './VersionPreview';
import type { Version } from '../../lib/version-storage';

interface InterfaceColors {
  bg: string;
  bgSurface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
}

interface VersionHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor | null;
  interfaceColors: InterfaceColors;
}

export function VersionHistoryPanel({
  isOpen,
  onClose,
  editor,
  interfaceColors,
}: VersionHistoryPanelProps) {
  const {
    versions,
    selectedVersion,
    isLoading,
    loadVersions,
    selectVersion,
    restoreVersion,
    clearSelection,
  } = useVersionHistory();

  const [isRestoring, setIsRestoring] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Load versions when panel opens
  useEffect(() => {
    if (isOpen) {
      loadVersions();
    } else {
      clearSelection();
    }
  }, [isOpen, loadVersions, clearSelection]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showConfirmModal) {
          setShowConfirmModal(false);
        } else {
          onClose();
        }
        return;
      }

      // Up/Down arrow navigation
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (versions.length === 0) return;

        const currentIndex = selectedVersion
          ? versions.findIndex(v => v.id === selectedVersion.id)
          : -1;

        let newIndex: number;
        if (e.key === 'ArrowUp') {
          newIndex = currentIndex <= 0 ? versions.length - 1 : currentIndex - 1;
        } else {
          newIndex = currentIndex >= versions.length - 1 ? 0 : currentIndex + 1;
        }

        selectVersion(versions[newIndex].id);

        // Scroll the selected card into view
        setTimeout(() => {
          const card = document.querySelector(`[data-version-id="${versions[newIndex].id}"]`);
          card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 0);
      }

      // Enter to restore
      if (e.key === 'Enter' && selectedVersion && !showConfirmModal) {
        setShowConfirmModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, versions, selectedVersion, selectVersion, showConfirmModal]);

  const handleRestoreClick = useCallback(() => {
    if (!selectedVersion) return;
    setShowConfirmModal(true);
  }, [selectedVersion]);

  const handleConfirmRestore = useCallback(async () => {
    if (!editor || !selectedVersion || isRestoring) return;

    setIsRestoring(true);
    try {
      const success = await restoreVersion(editor);
      if (success) {
        setShowConfirmModal(false);
        onClose();
      }
    } finally {
      setIsRestoring(false);
    }
  }, [editor, selectedVersion, isRestoring, restoreVersion, onClose]);

  const formatTimestamp = (timestamp: number): { relative: string; absolute: string } => {
    const now = Date.now();
    const diff = now - timestamp;
    const date = new Date(timestamp);
    const hours = Math.floor(diff / 3600000);

    let relative: string;
    if (hours >= 24) {
      // Absolute time for >24h
      relative = date.toLocaleString();
    } else {
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) relative = 'Just now';
      else if (minutes < 60) relative = `${minutes}m ago`;
      else relative = `${hours}h ago`;
    }

    return { relative, absolute: date.toLocaleString() };
  };

  const getVersionNumber = (index: number): number => versions.length - index;

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'stretch',
        padding: '32px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: interfaceColors.bg,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Left sidebar - version list */}
        <div
          style={{
            width: '320px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: interfaceColors.bgSurface,
            borderRight: `1px solid ${interfaceColors.border}`,
          }}
        >
          {/* Header with proper padding */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: `1px solid ${interfaceColors.border}`,
            }}
          >
            <h2
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: interfaceColors.textPrimary,
                margin: 0,
              }}
            >
              Version History
            </h2>
            <p
              style={{
                fontSize: '12px',
                color: interfaceColors.textMuted,
                margin: '8px 0 0 0',
              }}
            >
              {versions.length} version{versions.length !== 1 ? 's' : ''} saved
            </p>
          </div>

          {/* Version list - scrollable */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {isLoading && versions.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: interfaceColors.textMuted }}>
                  Loading versions...
                </p>
              </div>
            ) : versions.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: interfaceColors.textMuted, margin: '0 0 12px 0' }}>
                  No versions saved yet.
                </p>
                <p style={{ fontSize: '12px', color: interfaceColors.textMuted, margin: 0 }}>
                  Save your document (Cmd+S) to create versions.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {versions.map((version, index) => (
                  <VersionCard
                    key={version.id}
                    version={version}
                    versionNumber={getVersionNumber(index)}
                    isSelected={selectedVersion?.id === version.id}
                    onSelect={() => selectVersion(version.id)}
                    formatTimestamp={formatTimestamp}
                    interfaceColors={interfaceColors}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side - preview */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          {/* Preview header with proper padding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              borderBottom: `1px solid ${interfaceColors.border}`,
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: interfaceColors.textPrimary,
                  margin: 0,
                }}
              >
                Preview
              </h3>
              {selectedVersion && (
                <p
                  style={{
                    fontSize: '12px',
                    color: interfaceColors.textMuted,
                    margin: '6px 0 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span>{selectedVersion.word_count.toLocaleString()} words</span>
                  <span style={{ color: interfaceColors.border }}>|</span>
                  <span>Saved {new Date(selectedVersion.timestamp).toLocaleString()}</span>
                </p>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {selectedVersion && (
                <button
                  onClick={handleRestoreClick}
                  disabled={isRestoring}
                  style={{
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: 500,
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#0066cc',
                    color: '#ffffff',
                    cursor: isRestoring ? 'not-allowed' : 'pointer',
                    opacity: isRestoring ? 0.5 : 1,
                  }}
                >
                  Restore This Version
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  fontSize: '13px',
                  borderRadius: '6px',
                  backgroundColor: interfaceColors.bgSurface,
                  border: `1px solid ${interfaceColors.border}`,
                  color: interfaceColors.textPrimary,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>

          {/* Preview content */}
          <VersionPreview
            version={selectedVersion}
            interfaceColors={interfaceColors}
          />
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedVersion && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            style={{
              backgroundColor: interfaceColors.bg,
              borderRadius: '12px',
              padding: '28px 32px',
              maxWidth: '420px',
              margin: '0 24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: interfaceColors.textPrimary,
                margin: '0 0 16px 0',
              }}
            >
              Restore Version?
            </h3>

            <p
              style={{
                fontSize: '14px',
                lineHeight: 1.6,
                color: interfaceColors.textSecondary,
                margin: '0 0 12px 0',
              }}
            >
              This will restore your document to the version from{' '}
              <strong style={{ color: interfaceColors.textPrimary }}>
                {new Date(selectedVersion.timestamp).toLocaleString()}
              </strong>.
            </p>

            <p
              style={{
                fontSize: '13px',
                lineHeight: 1.5,
                color: interfaceColors.textMuted,
                margin: '0 0 28px 0',
              }}
            >
              Your current work will be saved as a checkpoint before restoring.
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
              }}
            >
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 500,
                  borderRadius: '6px',
                  backgroundColor: interfaceColors.bgSurface,
                  border: `1px solid ${interfaceColors.border}`,
                  color: interfaceColors.textPrimary,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                style={{
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 500,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#0066cc',
                  color: '#ffffff',
                  cursor: isRestoring ? 'not-allowed' : 'pointer',
                  opacity: isRestoring ? 0.5 : 1,
                }}
              >
                {isRestoring ? 'Restoring...' : 'Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Version card with proper layout:
 * Line 1: Version number (v1, v2...) - 10px, regular
 * Line 2: Relative/absolute time - 12px, bold
 * Line 3: Word count - 11px, muted
 * + Tag in top right
 */
interface VersionCardProps {
  version: Version;
  versionNumber: number;
  isSelected: boolean;
  onSelect: () => void;
  formatTimestamp: (timestamp: number) => { relative: string; absolute: string };
  interfaceColors: InterfaceColors;
}

function VersionCard({
  version,
  versionNumber,
  isSelected,
  onSelect,
  formatTimestamp,
  interfaceColors,
}: VersionCardProps) {
  const { relative, absolute } = formatTimestamp(version.timestamp);

  // Determine tag
  const getTagInfo = () => {
    if (version.is_checkpoint) {
      const name = version.checkpoint_name || '';
      if (name.toLowerCase().includes('restore')) {
        return { label: 'Restored', bgColor: '#3b82f620', textColor: '#3b82f6' };
      }
      return { label: 'Checkpoint', bgColor: '#3b82f620', textColor: '#3b82f6' };
    }
    return { label: 'Version', bgColor: '#22c55e20', textColor: '#22c55e' };
  };

  const tag = getTagInfo();

  return (
    <button
      onClick={onSelect}
      data-version-id={version.id}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '16px 18px',
        borderRadius: '8px',
        border: isSelected ? '2px solid #0066cc' : `1px solid ${interfaceColors.border}`,
        backgroundColor: isSelected ? interfaceColors.bg : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      {/* Row 1: Version number + Tag */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <span
          style={{
            fontSize: '10px',
            fontWeight: 400,
            color: interfaceColors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          v{versionNumber}
        </span>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 500,
            padding: '3px 8px',
            borderRadius: '4px',
            backgroundColor: tag.bgColor,
            color: tag.textColor,
          }}
        >
          {tag.label}
        </span>
      </div>

      {/* Row 2: Timestamp (bold, larger) */}
      <p
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: interfaceColors.textPrimary,
          margin: '0 0 6px 0',
        }}
        title={absolute}
      >
        {relative}
      </p>

      {/* Row 3: Checkpoint name if exists */}
      {version.is_checkpoint && version.checkpoint_name && (
        <p
          style={{
            fontSize: '11px',
            color: interfaceColors.textSecondary,
            margin: '0 0 6px 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {version.checkpoint_name}
        </p>
      )}

      {/* Row 4: Word count */}
      <p
        style={{
          fontSize: '11px',
          color: interfaceColors.textMuted,
          margin: 0,
        }}
      >
        {version.word_count.toLocaleString()} words
      </p>
    </button>
  );
}

export default VersionHistoryPanel;
