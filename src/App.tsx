import { useState, useEffect } from 'react';
import Map from './components/Map';
import type { VendingMachine } from './types';
import { supabase } from './supabase';
import PostForm from './components/PostForm';

function App() {
  const [vendingMachines, setVendingMachines] = useState<VendingMachine[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedVm, setSelectedVm] = useState<VendingMachine | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 環境変数チェック
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isConfigured = supabaseUrl && supabaseKey && supabaseUrl !== 'your_supabase_project_url' && !supabaseUrl.includes('placeholder');

  useEffect(() => {
    // 少し遅延させて、環境変数の読み込みを確認
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (isConfigured) {
        fetchVendingMachines();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isConfigured]);

  const fetchVendingMachines = async () => {
    try {
      const { data, error } = await supabase
        .from('vending_machines')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching data:', error);
      } else if (data) {
        setVendingMachines(data);
      }
    } catch (err) {
      console.error('Failed to fetch:', err);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setSelectedVm(null);
    setIsFormOpen(true);
  };

  const handleMarkerClick = (vm: VendingMachine) => {
    setSelectedVm(vm);
    setSelectedLocation(null);
    setIsFormOpen(true);
  };

  const handlePostSuccess = () => {
    setIsFormOpen(false);
    setSelectedLocation(null);
    setSelectedVm(null);
    fetchVendingMachines();
  };

  // ローディング中
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="text-center">
          <div className="text-2xl mb-4">読み込み中...</div>
          <div className="text-sm text-gray-500">
            <p>環境変数チェック中...</p>
            <p className="mt-2 font-mono text-xs">
              URL: {supabaseUrl ? '✓ 設定済み' : '✗ 未設定'}<br/>
              Key: {supabaseKey ? '✓ 設定済み' : '✗ 未設定'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 環境変数未設定
  if (!isConfigured) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full border-l-4 border-red-500">
          <h1 className="text-xl font-bold text-gray-800 mb-4">⚠️ 設定が必要です</h1>
          <p className="mb-4 text-gray-600">Supabaseの接続情報が正しく設定されていません。</p>
          <div className="bg-gray-50 p-4 rounded border border-gray-200 text-sm mb-4">
            <p className="font-mono text-gray-700">.envファイルを作成し、以下を設定してください：</p>
            <pre className="mt-2 text-xs text-gray-500">
{`VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here`}
            </pre>
          </div>
          <p className="text-sm text-gray-500">詳細はREADME.mdの手順3をご確認ください。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col relative overflow-hidden">
      <header className="bg-white shadow-md p-4 z-10 flex-shrink-0">
        <h1 className="text-xl font-bold flex items-center gap-2">
          🥤 安い・変な自販機マップ
        </h1>
      </header>
      
      <main className="flex-grow relative z-0 h-full">
        <Map 
          vendingMachines={vendingMachines} 
          onMapClick={handleMapClick}
          onMarkerClick={handleMarkerClick}
          selectedLocation={selectedLocation}
        />
      </main>

      {isFormOpen && (
        <div className="absolute top-0 right-0 h-full w-full sm:w-96 bg-white shadow-xl z-20 p-4 overflow-y-auto transform transition-transform duration-300">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-bold">
               {selectedVm ? '追加投稿' : '自販機を追加'}
             </h2>
             <button 
               onClick={() => { 
                 setIsFormOpen(false); 
                 setSelectedLocation(null); 
                 setSelectedVm(null); 
               }}
               className="text-gray-500 hover:text-gray-700 p-2"
             >
               ✕
             </button>
           </div>
           
           {(selectedLocation || selectedVm) && (
             <PostForm 
               lat={selectedVm ? selectedVm.lat : selectedLocation!.lat} 
               lng={selectedVm ? selectedVm.lng : selectedLocation!.lng}
               existingVm={selectedVm}
               onSuccess={handlePostSuccess}
               onCancel={() => { 
                 setIsFormOpen(false); 
                 setSelectedLocation(null); 
                 setSelectedVm(null); 
               }}
             />
           )}
        </div>
      )}
    </div>
  );
}

export default App;
