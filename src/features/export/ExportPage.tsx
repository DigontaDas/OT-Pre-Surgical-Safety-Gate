import { useState } from 'react';
import { useFhirClient } from '../../services/auth/FhirClientContext';
import { useSafetyCheck } from '../../hooks/fhirHooks';
import { buildComposition, buildDocumentBundle, exportDocument } from '../../services/document/documentBuilder';

export function ExportPage() {
  const client = useFhirClient();
  const { safetyReport } = useSafetyCheck();
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [previewBundle, setPreviewBundle] = useState<any>(null);

  if (!safetyReport) {
    return <div>No safety report available to export.</div>;
  }

  const handlePreview = () => {
    const composition = buildComposition(client, safetyReport);
    const bundle = buildDocumentBundle(client, safetyReport, composition);
    setPreviewBundle(bundle);
  };

  const handleExport = async () => {
    if (!previewBundle) return;
    
    setIsExporting(true);
    try {
      await exportDocument(client, previewBundle);
      setExportSuccess(true);
    } catch (err) {
      console.error('Export failed', err);
      alert('Failed to export document to FHIR Server.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Pre-Surgical Safety Gate Report Export</h2>
      
      {!previewBundle ? (
        <button className="btn btn--primary" onClick={handlePreview}>
          Generate Document Preview
        </button>
      ) : (
        <div style={{ marginTop: '20px' }}>
          <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px', overflowX: 'auto' }}>
            <pre style={{ fontSize: '12px' }}>
              {JSON.stringify(previewBundle, null, 2)}
            </pre>
          </div>
          
          <button 
            className="btn btn--primary" 
            onClick={handleExport}
            disabled={isExporting || exportSuccess}
          >
            {isExporting ? 'Exporting...' : exportSuccess ? 'Exported Successfully' : 'Export to EHR (FHIR Bundle)'}
          </button>
        </div>
      )}
    </div>
  );
}
