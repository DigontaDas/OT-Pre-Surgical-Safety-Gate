import type { CheckResult } from '../types/safety';

interface SafetyCardProps {
  check: CheckResult;
  index: number;
}

export function SafetyCard({ check, index }: SafetyCardProps) {
  return (
    <div className={`safety-card safety-card--${check.status}`}>
      <div className="safety-card__header">
        <div className="safety-card__title">
          <span className="safety-card__number">{index}</span>
          {check.title}
        </div>
        <div className={`status-badge status-badge--${check.status}`}>
          {check.status === 'pass' && '✅ PASS'}
          {check.status === 'warning' && '⚠️ WARNING'}
          {check.status === 'fail' && '❌ FAIL'}
          {check.status === 'loading' && '...'}
          {check.status === 'unknown' && '?'}
        </div>
      </div>
      <div className="safety-card__body">
        <p style={{ fontWeight: '500', marginBottom: '8px', color: 'var(--color-text)' }}>
          {check.summary}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {check.details.map((detail: import('../types/safety').CheckDetail, idx: number) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ fontSize: '1.2em' }}>
                {detail.severity === 'success' && '✓'}
                {detail.severity === 'warning' && '⚠'}
                {detail.severity === 'error' && '✗'}
                {detail.severity === 'info' && 'i'}
              </span>
              <div>
                <span>{detail.message}</span>
                {detail.code && (
                  <div style={{ marginTop: '4px' }}>
                    <span className="clinical-code">
                      {detail.code.display} ({detail.code.code})
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
