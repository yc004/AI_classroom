import React from 'react';
import { useLocation, Outlet } from 'react-router-dom';

const Layout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <Outlet key={location.pathname} />
    </div>
  );
};

export default Layout;