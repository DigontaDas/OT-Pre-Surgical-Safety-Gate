import type { PatientSummary } from '../types/safety';

interface PatientBannerProps {
  patient: PatientSummary;
}

export function PatientBanner({ patient }: PatientBannerProps) {
  return (
    <div className="patient-banner">
      <div className="patient-banner__avatar">
        {patient.initials}
      </div>
      <div>
        <h2 className="patient-banner__name">{patient.name}</h2>
        <div className="patient-banner__details">
          <span className="patient-banner__detail">
            DOB: <strong>{patient.birthDate}</strong> ({patient.age}y)
          </span>
          <span className="patient-banner__detail">
            Gender: <strong>{patient.gender}</strong>
          </span>
          {patient.mrn && (
            <span className="patient-banner__detail">
              MRN: <strong>{patient.mrn}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
