import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { licensesApi } from '../api/licenses.api';

export default function CertificateDownload({ licenseId, fileName }: { licenseId: string; fileName: string }) {
  const [loading, setLoading] = useState(false);
  const download = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const blob = await licensesApi.downloadCertificate(licenseId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      window.alert('No se pudo descargar el certificado.');
    } finally {
      setLoading(false);
    }
  };
  return <button type="button" onClick={download} disabled={loading} aria-label={`Descargar certificado ${fileName}`} className="inline-flex items-center gap-1 underline disabled:opacity-50">
    <Download className="h-3 w-3" /> {loading ? 'Descargando...' : fileName}
  </button>;
}
