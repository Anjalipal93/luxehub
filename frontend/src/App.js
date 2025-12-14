import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import AuthPage from './pages/AuthPage';
import ChatLogin from './pages/Auth/ChatLogin';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import AIForecast from './pages/AIForecast';
import Communication from './pages/Communication';
import Users from './pages/Users';
import Profile from './pages/Profile';
import InviteCollaborators from './pages/InviteCollaborators';
import TeamSales from './pages/TeamSales';
import Messages from './pages/Messages';
import EntrepreneurPage from './pages/EntrepreneurPage';
import AIInsights from './pages/AIInsights';
import ActivityLog from './pages/ActivityLog';
import TeamPerformance from './pages/TeamPerformance';
import ChattingMessages from './pages/ChattingMessages';
import ProductQRGenerator from './pages/ProductQRGenerator';
import QRScanResult from './pages/QRScanResult';
import Email from './pages/Email';
import Layout from './components/Layout';
import AIAssistant from './components/AIAssistant';

function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/chat-login" element={<ChatLogin />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/qr-scan-result" element={<QRScanResult />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="sales" element={<Sales />} />
              <Route path="ai-forecast" element={<AIForecast />} />
              <Route path="communication" element={<Communication />} />
              <Route path="users" element={<Users />} />
              <Route path="profile" element={<Profile />} />
              <Route path="invite-collaborators" element={<InviteCollaborators />} />
              <Route path="team-sales" element={<TeamSales />} />
              <Route path="messages" element={<Messages />} />
              <Route path="entrepreneurs" element={<EntrepreneurPage />} />
              <Route path="ai-insights" element={<AIInsights />} />
              <Route path="activity-log" element={<ActivityLog />} />
              <Route path="team-performance" element={<TeamPerformance />} />
              <Route path="chatting-messages" element={<ChattingMessages />} />
              <Route path="product-qr" element={<ProductQRGenerator />} />
              <Route path="email" element={<Email />} />
            </Route>
          </Routes>
        </Router>
        <AIAssistant />
        <ToastContainer
          position="top-right"
          autoClose={2000}
          hideProgressBar={true}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          limit={3}
          theme="colored"
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

