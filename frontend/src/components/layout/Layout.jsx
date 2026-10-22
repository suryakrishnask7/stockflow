import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="d-flex min-vh-100">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="d-flex flex-column flex-grow-1 overflow-x-hidden min-vh-100">
        <Navbar />
        <main className="flex-grow-1 p-4 p-lg-5 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
