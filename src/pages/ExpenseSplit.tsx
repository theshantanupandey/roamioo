
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ExpenseSplit() {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/');
  }, [navigate]);

  return null;
}
