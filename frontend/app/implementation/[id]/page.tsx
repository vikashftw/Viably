'use client';

import { useParams } from 'next/navigation';
import { ImplementationFlow } from '../../components/ImplementationFlow';

export default function ImplementationPage() {
  const params = useParams();
  const analysisId = params.id as string;

  // In a real implementation, you might want to:
  // 1. Validate the analysis ID exists
  // 2. Load analysis metadata from backend
  // 3. Allow user to configure target repo

  // For now, using default PNC target repo
  const defaultTargetRepo = {
    owner: 'pnc-bank',
    repo: 'banking-platform',
    branch: 'main'
  };

  return (
    <ImplementationFlow
      analysisId={analysisId}
      targetRepo={defaultTargetRepo}
      onComplete={(result) => {
        console.log('Implementation completed:', result);
        // Could add analytics tracking here
      }}
    />
  );
}
