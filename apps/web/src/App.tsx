import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NewRunPage } from './pages/NewRunPage';
import { RunDetailPage } from './pages/RunDetailPage';
import { RunHistoryPage } from './pages/RunHistoryPage';

const queryClient = new QueryClient();

function App() {
  const [activeTab, setActiveTab] = React.useState('/');

  React.useEffect(() => {
    setActiveTab(window.location.pathname);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-blue-100">
          {/* Premium Navigation */}
          <nav className="glass sticky top-0 z-50 border-b border-gray-200/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-20">
                <div className="flex items-center space-x-12">
                  <Link
                    to="/"
                    onClick={() => setActiveTab('/')}
                    className="flex items-center space-x-3 group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                      TaskFlow AI
                    </span>
                  </Link>
                  <div className="hidden md:flex space-x-1">
                    <NavLink to="/new" active={activeTab === '/new'} onClick={() => setActiveTab('/new')}>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      New Run
                    </NavLink>
                    <NavLink to="/history" active={activeTab === '/history'} onClick={() => setActiveTab('/history')}>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      History
                    </NavLink>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="hidden sm:flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    AI Ready
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
            <Routes>
              <Route path="/" element={<RunHistoryPage />} />
              <Route path="/new" element={<NewRunPage />} />
              <Route path="/runs/:runId" element={<RunDetailPage />} />
              <Route path="/history" element={<RunHistoryPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function NavLink({ to, active, children, onClick }: { to: string; active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`inline-flex items-center px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ${
        active
          ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/30'
          : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
      }`}
    >
      {children}
    </Link>
  );
}

export default App;
