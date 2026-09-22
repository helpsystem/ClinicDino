import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Trophy, Settings, ImageIcon, QrCode, LogOut } from 'lucide-react';
import AdminDashboard from '../pages/admin/AdminDashboard';
import Login from '../pages/admin/Login';
import { auth } from '../lib/firebase';
import { Button } from '../components/ui/button';

function AdminSidebarLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return <Navigate to="/admin/login" />;

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Manage Doctors', path: '/admin/doctors', icon: Users },
    { name: 'Leaderboard', path: '/admin/leaderboard', icon: Trophy },
    { name: 'Branding', path: '/admin/branding', icon: Settings },
    { name: 'Assets', path: '/admin/assets', icon: ImageIcon },
    { name: 'QR Print Kit', path: '/admin/qr', icon: QrCode },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-black text-white tracking-tight">ClinicDino</h2>
          <p className="text-slate-500 text-sm font-medium">Admin Portal</p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => auth.signOut()}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

export default function AdminRoute() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route 
        path="/*" 
        element={
          <AdminSidebarLayout>
            <AdminDashboard />
          </AdminSidebarLayout>
        } 
      />
    </Routes>
  );
}
