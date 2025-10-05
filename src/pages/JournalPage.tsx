
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Book } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Journal from '@/components/Journal';

const JournalPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center">
          <Book className="h-6 w-6 mr-2 text-[#95C11F]" />
          Travel Journal
        </h1>
        <Button 
          size="sm" 
          className="bg-[#95C11F] text-black hover:bg-[#7a9e19]"
          onClick={() => navigate('/journal/compose')}
        >
          <Plus className="h-4 w-4 mr-1" />
          New Entry
        </Button>
      </div>
      <Journal showAllControls={false} />
    </div>
  );
};

export default JournalPage;
