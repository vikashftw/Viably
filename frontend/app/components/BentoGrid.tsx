import React from 'react';
import { Box1 } from './Boxes/Box1';
import { Box2 } from './Boxes/Box2';
import { Box3 } from './Boxes/Box3';
import { Box4 } from './Boxes/Box4';
import { Box5 } from './Boxes/Box5';
import { Box6 } from './Boxes/Box6';

export const BentoGrid = () => {
  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-4 h-full">
      <div className="col-span-1 row-span-2">
        <Box1 />
      </div>
      <div className="col-span-1 row-span-1">
        <Box2 />
      </div>
      <div className="col-span-1 row-span-2">
        <Box3 />
      </div>
      <div className="col-span-1 row-span-1">
        <Box4 />
      </div>
      <div className="col-span-1 row-span-1">
        <Box5 />
      </div>
      <div className="col-span-2 row-span-1">
        <Box6 />
      </div>
    </div>
  );
};
