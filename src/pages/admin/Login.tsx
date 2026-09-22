import { signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const token = await result.user.getIdToken();
      
      // Sync user with our database
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        navigate('/admin');
      }
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center rounded-3xl shadow-xl border-slate-100">
        <h1 className="text-3xl font-black text-slate-800 mb-2">ClinicDino Admin</h1>
        <p className="text-slate-500 mb-8">Manage your clinic's waiting room game.</p>
        
        <Button onClick={handleLogin} size="lg" className="w-full rounded-full h-14 text-lg">
          Sign In with Google
        </Button>
      </Card>
    </div>
  );
}
