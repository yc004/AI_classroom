import React, { useEffect, useState } from 'react';
import { useLocation, Outlet } from 'react-router-dom';

const Layout: React.FC = () => {
  const location = useLocation();
  const [animateKey, setAnimateKey] = useState(0);

  useEffect(() => {
    setAnimateKey(prev => prev + 1);
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      <div
        key={animateKey}
        className="min-h-screen animate-slide-in"
      >
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;