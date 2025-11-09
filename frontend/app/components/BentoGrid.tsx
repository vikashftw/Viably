'use client';

import React, { useState, useEffect } from 'react';
import { Box1 } from './Boxes/Box1';
import { Box2 } from './Boxes/Box2';
import { Box3 } from './Boxes/Box3';
import { Box4 } from './Boxes/Box4';
import { Box5 } from './Boxes/Box5';
import { Box6 } from './Boxes/Box6';
import { useSharedAnalysis } from '../hooks/useSharedAnalysis';

export const BentoGrid = ({ backlog }: { backlog: any[] }) => {
  const { events, latestEvent } = useSharedAnalysis();
  const [analysisData, setAnalysisData] = useState<any>(null);

  // Update analysis data based on incoming events
  useEffect(() => {
    if (!latestEvent) return;

    if (latestEvent.type === 'agent_complete') {
      const { agent, result } = latestEvent;

      setAnalysisData((prev: any) => ({
        ...prev,
        [agent]: result
      }));

      console.log(`[BentoGrid] Updated ${agent} data:`, result);
    } else if (latestEvent.type === 'complete') {
      // Store complete analysis
      if (latestEvent.analysis) {
        setAnalysisData(latestEvent.analysis);
        console.log('[BentoGrid] Received complete analysis:', latestEvent.analysis);
      }
    }
  }, [latestEvent]);

  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-4 h-full">
      <div className="col-span-1 row-span-2">
        <Box1 analysisData={analysisData} />
      </div>
      <div className="col-span-1 row-span-1">
        <Box2 analysisData={analysisData} />
      </div>
      <div className="col-span-1 row-span-2 min-h-0">
        <Box3 backlog={backlog} />
      </div>
      <div className="col-span-1 row-span-1">
        <Box4 analysisData={analysisData} />
      </div>
      <div className="col-span-1 row-span-1">
        <Box5 analysisData={analysisData} />
      </div>
      <div className="col-span-2 row-span-1">
        <Box6 analysisData={analysisData} />
      </div>
    </div>
  );
};
