import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import FloatingHearts from '../components/FloatingHearts';
import './MainLayout.css';

const MainLayout = ({ onLogout }) => {
  return (
    <div className="layoutContainer">
      {/* 🔥 배경 효과 */}
      <FloatingHearts />
      <div className="backgroundBlur" />

      {/* 🔥 패널 레이아웃 */}
      <aside className="sidebarPanel">
        <Sidebar onLogout={onLogout} />
      </aside>

      <main className="mainPanel">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
