import React, { useEffect, useState } from 'react';
import { useLocation, Outlet } from 'react-router-dom';

const Layout: React.FC = () => {
  const location = useLocation();
  const [key, setKey] = useState(location.pathname);

  useEffect(() => {
    // 当路径变化时，更新key以触发重新渲染
    setKey(location.pathname);
  }, [location]);

  return (
    <div className="min-h-screen">
      <Outlet key={key} />
    </div>
  );
};

export default Layout;