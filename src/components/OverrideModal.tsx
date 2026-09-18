import { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';
import type { ClinicalOverride } from '../types/safety';

interface OverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (override: ClinicalOverride) => void;
  warnings: string[];
  existingOverride?: ClinicalOverride;
}

const PRESET_REASONS = [
  'Point-of-care / holding area blood labs drawn & verified within normal limits.',
  'Emergency surgical intervention — clinical benefit outweighs delay for repeat testing.',
  'Alternative antibiotic prophylaxis regimen ordered with anesthesia consultation.',
  'Surgeon personally evaluated patient condition and accepted documented clinical risk.'
];

export function OverrideModal({
  isOpen,
  onClose,
  onSave,
  warnings,
  existingOverride
}: OverrideModalProps) {
  const [clinicianName, setClinicianName] = useState(existingOverride?.clinicianName || 'Dr. Alex Rivera, MD');
  const [role, setRole] = useState(existingOverride?.role || 'Attending Surgeon');
  const [reason, setReason] = useState(existingOverride?.reason || '');
  const [attestationChecked, setAttestationChecked] = useState(false);

  useEffect(() => {
    if (existingOverride) {
      setClinicianName(existingOverride.clinicianName);
      setRole(existingOverride.role);
      setReason(existingOverride.reason);
      setAttestationChecked(true);
    }
  }, [existingOverride, isOpen]);

  if (!isOpen) return null;

  const handlePresetClick = (preset: string) => {
    setReason(prev => prev ? `${prev}\n${preset}` : preset);
  };

  const handleSave = () => {
    if (!reason.trim() || !attestationChecked || !clinicianName.trim()) {
      return;
    }

    const override: ClinicalOverride = {
      clinicianName: clinicianName.trim(),
      role: role.trim() || 'Attending Surgeon',
      reason: reason.trim(),
      timestamp: new Date().toISOString(),
      acknowledgedWarnings: warnings
    };

    onSave(override);
    onClose();
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '620px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          animation: 'fadeIn 0.25s ease-out'
        }}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          background: '#fffbeb',
          borderBottom: '1px solid #fef3c7'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: '#fef3c7',
              borderRadius: '10px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={24} color="#d97706" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#92400e', fontWeight: 600 }}>
                Surgeon Clinical Override
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#b45309' }}>
                Document clinical rationale to proceed despite flagged warnings
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              display: 'flex',
              padding: '4px',
              borderRadius: '6px',
              transition: 'background 0.2s'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Active Warnings to Acknowledge */}
          {warnings.length > 0 && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '14px 16px'
            }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Warnings Requiring Override ({warnings.length})
              </span>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '0.85rem', color: '#334155' }}>
                {warnings.map((w, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Preset Chips */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
              Quick Clinical Justification Presets
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {PRESET_REASONS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  style={{
                    fontSize: '0.75rem',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#334155',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#e2e8f0';
                    e.currentTarget.style.borderColor = '#94a3b8';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                >
                  + {preset.slice(0, 48)}...
                </button>
              ))}
            </div>
          </div>

          {/* Clinical Justification Textarea */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Clinical Override Justification Note <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Detail the clinical assessment, risk mitigation steps, and why the procedure is safe to proceed..."
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                color: '#1e293b',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Clinician Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Attending Clinician Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={clinicianName}
                onChange={(e) => setClinicianName(e.target.value)}
                placeholder="Dr. Full Name, MD"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Clinical Role / Title
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Attending Surgeon"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Signature Attestation */}
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            background: '#f1f5f9',
            padding: '12px 14px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={attestationChecked}
              onChange={(e) => setAttestationChecked(e.target.checked)}
              style={{ marginTop: '3px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.8rem', color: '#334155', lineHeight: '1.4' }}>
              <strong>Clinical Attestation:</strong> I confirm that I have reviewed the active safety warnings and, in my medical judgment, authorize proceeding with the surgical procedure under documented precautions.
            </span>
          </label>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onClose}
            style={{ padding: '8px 16px', fontSize: '0.9rem' }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleSave}
            disabled={!reason.trim() || !attestationChecked || !clinicianName.trim()}
            style={{
              padding: '8px 20px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: (!reason.trim() || !attestationChecked || !clinicianName.trim()) ? 0.6 : 1,
              cursor: (!reason.trim() || !attestationChecked || !clinicianName.trim()) ? 'not-allowed' : 'pointer'
            }}
          >
            <ShieldCheck size={18} />
            Authorize &amp; Sign Override
          </button>
        </div>
      </div>
    </div>
  );
}
