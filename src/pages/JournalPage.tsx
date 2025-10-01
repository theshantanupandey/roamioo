
import React from 'react';
import Journal from '@/components/Journal';

const JournalPage = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Travel Journal</h1>
      <Journal showAllControls={true} />
    </div>
  );
};

export default JournalPage;
