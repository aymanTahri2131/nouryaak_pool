import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PoolLeaderboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to reports page pool tab
    navigate('/reports', { replace: true });
  }, [navigate]);

  return null;
};

export default PoolLeaderboard;
