import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent } from '../../components/ui/tabs';
import { Clinic, Doctor, LeaderboardEntry } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { Activity, Users, Trophy } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  
  // New clinic form
  const [clinicName, setClinicName] = useState('');
  const [clinicSlug, setClinicSlug] = useState('');

  // New doctor form
  const [docName, setDocName] = useState('');
  const [docTitle, setDocTitle] = useState('');

  const qrRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (u) {
        setUser(u);
        fetchAdminData(u);
      } else {
        navigate('/admin/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchAdminData = async (u: any) => {
    const token = await u.getIdToken();
    try {
      const res = await fetch('/api/admin/my-clinic', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const c = await res.json();
        setClinic(c);
        fetchDoctors(token);
        fetchLeaderboard(token);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async (token: string) => {
    const res = await fetch('/api/admin/doctors', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setDoctors(await res.json());
  };

  const fetchLeaderboard = async (token: string) => {
    const res = await fetch('/api/admin/leaderboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setLeaderboard(await res.json());
  };

  const createClinic = async () => {
    const token = await user.getIdToken();
    const res = await fetch('/api/admin/clinics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: clinicName, slug: clinicSlug.toLowerCase() })
    });
    if (res.ok) {
      setClinic(await res.json());
    }
  };

  const addDoctor = async () => {
    const token = await user.getIdToken();
    const res = await fetch('/api/admin/doctors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: docName, title: docTitle })
    });
    if (res.ok) {
      setDocName(''); setDocTitle('');
      fetchDoctors(token);
    }
  };

  const toggleDoctor = async (id: string, isActive: boolean) => {
    const token = await user.getIdToken();
    await fetch(`/api/admin/doctors/${id}/toggle`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ isActive: !isActive })
    });
    fetchDoctors(token);
  };

  const deleteScore = async (id: string) => {
    const token = await user.getIdToken();
    await fetch(`/api/admin/leaderboard/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchLeaderboard(token);
  };
  
  const resetLeaderboard = async () => {
    if(!confirm("Are you sure you want to delete all scores?")) return;
    const token = await user.getIdToken();
    await fetch(`/api/admin/leaderboard-reset`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchLeaderboard(token);
  };

  const [rewardText, setRewardText] = useState(clinic?.rewardText || '');
  const [primaryColor, setPrimaryColor] = useState(clinic?.primaryColor || '#0ea5e9');
  
  const [gameAssets, setGameAssets] = useState(clinic?.gameAssets || {
    bgUrl: '',
    doctorUrl: '',
    pillUrl: '',
    bottleUrl: '',
    virusUrl: '',
    syringeUrl: ''
  });

  const saveClinicSettings = async () => {
    const token = await user.getIdToken();
    const res = await fetch('/api/admin/my-clinic', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ 
        name: clinic.name, 
        slug: clinic.slug, 
        primaryColor, 
        rewardText,
        gameAssets
      })
    });
    if (res.ok) {
      setClinic(await res.json());
      alert('Settings saved!');
    }
  };

  const handleAssetUpload = (key: keyof typeof gameAssets, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setGameAssets(prev => ({ ...prev, [key]: e.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const downloadQR = () => {
    if (!qrRef.current) return;
    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clinicdino-qr-${clinic?.slug}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-8">Loading...</div>;

  if (!clinic) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Set up your Clinic</h2>
          <Input 
            placeholder="Clinic Name" 
            value={clinicName} onChange={e => setClinicName(e.target.value)} 
            className="mb-4"
          />
          <Input 
            placeholder="URL Slug (e.g. dr-smith)" 
            value={clinicSlug} onChange={e => setClinicSlug(e.target.value)} 
            className="mb-4"
          />
          <Button onClick={createClinic} className="w-full">Create Clinic</Button>
        </div>
      </div>
    );
  }

  const playUrl = `${window.location.origin}/play/${clinic.slug}`;
  
  // Determine which tab to show based on URL
  const currentTab = location.pathname.replace('/admin', '').replace('/', '') || 'dashboard';

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">{clinic.name}</h1>
          <p className="text-slate-500">Manage your clinic game settings</p>
        </div>

        <Tabs value={currentTab} className="w-full">
          <TabsContent value="dashboard" className="mt-0">
            <h2 className="text-xl font-bold mb-6">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="p-4 bg-blue-100 text-blue-600 rounded-lg">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">Status</p>
                  <p className="text-2xl font-black">Active</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="p-4 bg-green-100 text-green-600 rounded-lg">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">Total Doctors</p>
                  <p className="text-2xl font-black">{doctors.length}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="p-4 bg-orange-100 text-orange-600 rounded-lg">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">Leaderboard Entries</p>
                  <p className="text-2xl font-black">{leaderboard.length}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="doctors" className="mt-0 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold mb-4">Manage Doctors</h2>
            <div className="flex gap-4 mb-6">
              <Input placeholder="Doctor Name" value={docName} onChange={e => setDocName(e.target.value)} />
              <Input placeholder="Title / Specialty" value={docTitle} onChange={e => setDocTitle(e.target.value)} />
              <Button onClick={addDoctor}>Add Doctor</Button>
            </div>
            
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="p-3 font-semibold">Name</th>
                  <th className="p-3 font-semibold">Title</th>
                  <th className="p-3 font-semibold text-right">Status</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map(doc => (
                  <tr key={doc.id} className="border-b">
                    <td className="p-3 font-medium">{doc.name}</td>
                    <td className="p-3 text-slate-500">{doc.title}</td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${doc.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {doc.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => toggleDoctor(doc.id, !!doc.isActive)}>
                        Toggle
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-0 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Global Moderation Queue</h2>
              <Button variant="destructive" size="sm" onClick={resetLeaderboard}>Reset Leaderboard</Button>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="p-3 font-semibold w-16">Rank</th>
                  <th className="p-3 font-semibold">Player</th>
                  <th className="p-3 font-semibold">Score</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, idx) => (
                  <tr key={entry.id} className="border-b">
                    <td className="p-3 font-bold text-slate-400">#{idx + 1}</td>
                    <td className="p-3 flex items-center gap-3">
                      {entry.selfieUrl ? (
                        <img src={entry.selfieUrl} className="w-10 h-10 rounded object-cover border" />
                      ) : (
                        <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center font-bold text-slate-400">
                          {entry.playerName.charAt(0)}
                        </div>
                      )}
                      <span className="font-medium">{entry.playerName}</span>
                    </td>
                    <td className="p-3 font-black text-blue-500">{entry.score}</td>
                    <td className="p-3 text-right">
                      <Button variant="destructive" size="sm" onClick={() => deleteScore(entry.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>

          <TabsContent value="branding" className="mt-0 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold mb-4">Clinic Branding (Mockup)</h2>
            <p className="text-slate-500 mb-4">Configure primary colors, reward text, and logo here.</p>
            <div className="max-w-md space-y-4">
               <div>
                  <label className="text-sm font-semibold">Reward Text</label>
                  <Input value={rewardText} onChange={e => setRewardText(e.target.value)} placeholder="e.g. Free Checkup for #1" />
               </div>
               <div>
                  <label className="text-sm font-semibold">Primary Color (Hex)</label>
                  <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} type="color" className="h-12 w-24 p-1" />
               </div>
               <Button onClick={saveClinicSettings}>Save Changes</Button>
            </div>
          </TabsContent>

          <TabsContent value="assets" className="mt-0 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold mb-4">Game Assets Manager</h2>
            <p className="text-slate-500 mb-6">Upload custom sprites for your clinic's game (PNG format recommended).</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { key: 'bgUrl', label: 'Background Image (clinic_bg)' },
                { key: 'doctorUrl', label: 'Doctor Sprite (doctor_run)' },
                { key: 'pillUrl', label: 'Pill Obstacle (pill_capsule)' },
                { key: 'bottleUrl', label: 'Bottle Obstacle (medicine_bottle)' },
                { key: 'virusUrl', label: 'Virus Obstacle (virus)' },
                { key: 'syringeUrl', label: 'Syringe Obstacle (syringe)' },
              ].map(asset => (
                <div key={asset.key} className="border p-4 rounded-lg bg-slate-50">
                  <label className="text-sm font-bold block mb-2">{asset.label}</label>
                  {gameAssets[asset.key as keyof typeof gameAssets] && (
                    <img 
                      src={gameAssets[asset.key as keyof typeof gameAssets]} 
                      className="w-full h-24 object-contain bg-white rounded border mb-2" 
                      alt={asset.label}
                    />
                  )}
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => e.target.files && handleAssetUpload(asset.key as keyof typeof gameAssets, e.target.files[0])} 
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Button onClick={saveClinicSettings} size="lg">Save All Assets</Button>
            </div>
          </TabsContent>

          <TabsContent value="qr" className="mt-0 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center text-center">
            <h2 className="text-xl font-bold mb-2">Print-Ready QR Code</h2>
            <p className="text-slate-500 max-w-md mb-8">
              Download this high-resolution SVG file. It includes perfect vector edges, suitable for UV flatbed printing on acrylic desk stands.
            </p>
            
            <div className="bg-slate-50 p-8 rounded-3xl border-2 border-dashed border-slate-200 mb-8 inline-block">
              <QRCodeSVG 
                value={playUrl} 
                size={256} 
                bgColor={"#ffffff"} 
                fgColor={"#0f172a"} 
                level={"Q"}
                includeMargin={true}
                ref={qrRef}
              />
              <p className="font-bold text-slate-800 mt-4 text-xl tracking-tight">Scan to Play</p>
              <p className="text-blue-500 font-semibold">{playUrl.replace('https://', '')}</p>
            </div>

            <div className="flex gap-4">
              <Button size="lg" onClick={downloadQR}>Download SVG Kit</Button>
              <Button size="lg" variant="outline" onClick={() => window.open(playUrl, '_blank')}>Open Game URL</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
