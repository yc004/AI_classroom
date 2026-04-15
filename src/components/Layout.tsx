import React, { useEffect, useState } from 'react';
import { useLocation, Outlet } from 'react-router-dom';

const Layout: React.FC = () => {
  const location = useLocation();
  const [currentKey, setCurrentKey] = useState(location.pathname);
  const [prevKey, setPrevKey] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (location.pathname !== currentKey) {
      setIsTransitioning(true);
      setPrevKey(currentKey);
      
      // 等待新页面渲染后再完成过渡
      const timer = setTimeout(() => {
        setCurrentKey(location.pathname);
        
        // 等待动画完成
        const endTimer = setTimeout(() => {
          setIsTransitioning(false);
          setPrevKey(null);
        }, 300);
        
        return () => clearTimeout(endTimer);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname, currentKey]);

  return (
    <div className="relative min-h-screen">
      {/* 旧页面 */}
      {prevKey && (
        <div 
          className="absolute inset-0 z-10 transition-opacity duration-300 ease-in-out"
          style={{ opacity: isTransitioning ? 0 : 1 }}
        >
          <Outlet key={prevKey} />
        </div>
      )}
      
      {/* 新页面 */}
      <div 
        className="relative z-20 transition-opacity transition-transform duration-300 ease-out"
        style={{ 
          opacity: isTransitioning ? 1 : 0,
          transform: isTransitioning ? 'translateY(0)' : 'translateY(10px)'
        }}
      >
        <Outlet key={currentKey} />
      </div>
    </div>
  );
};

export default Layout;