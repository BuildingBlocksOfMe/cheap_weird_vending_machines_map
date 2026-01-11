import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import type { VendingMachineType, VendingMachine } from '../types';
import { Loader2, Upload } from 'lucide-react';

interface PostFormProps {
  lat: number;
  lng: number;
  existingVm?: VendingMachine | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PostForm({ lat, lng, existingVm, onSuccess, onCancel }: PostFormProps) {
  const [type, setType] = useState<VendingMachineType>(existingVm?.type || 'cheap');
  const [price, setPrice] = useState<string>(existingVm?.price?.toString() || '');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingVm) {
      setType(existingVm.type);
      if (existingVm.price) {
        setPrice(existingVm.price.toString());
      }
    }
  }, [existingVm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let imagePath = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('vm-photos')
          .upload(filePath, imageFile);

        if (uploadError) {
          throw uploadError;
        }
        imagePath = filePath;
      }

      // 既存の自販機がある場合は、同じ位置に新しいレコードを作成（追加投稿）
      // 既存の自販機がない場合は、新しい自販機として作成
      const { error: insertError } = await supabase
        .from('vending_machines')
        .insert([
          {
            lat: existingVm ? existingVm.lat : lat,
            lng: existingVm ? existingVm.lng : lng,
            type: existingVm ? existingVm.type : type,
            price: price ? parseInt(price) : (existingVm?.price || null),
            description: description || null,
            image_path: imagePath,
          },
        ]);

      if (insertError) {
        throw insertError;
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error submitting:', err);
      setError(err.message || '投稿に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {existingVm && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
          <p className="font-medium text-blue-800">既存の自販機に追加投稿します</p>
          <p className="text-blue-600 mt-1">
            {existingVm.type === 'cheap' ? '安い' : '変な'}自販機
            {existingVm.price && ` - ¥${existingVm.price}`}
          </p>
        </div>
      )}

      {!existingVm && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">タイプ</label>
          <div className="mt-1 flex gap-4">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="radio"
                className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                name="type"
                value="cheap"
                checked={type === 'cheap'}
                onChange={() => setType('cheap')}
              />
              <span className="ml-2 text-sm">安い自販機</span>
            </label>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="radio"
                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                name="type"
                value="weird"
                checked={type === 'weird'}
                onChange={() => setType('weird')}
              />
              <span className="ml-2 text-sm">変な自販機</span>
            </label>
          </div>
        </div>
      )}

      {!existingVm && (
        <div>
          <label className="block text-sm font-medium text-gray-700">価格 (任意)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2"
            placeholder="100"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">説明・コメント</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2"
          placeholder={existingVm ? "追加のコメントや情報を入力..." : "コメントを入力..."}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">写真</label>
        <div className="mt-1 flex items-center">
            <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center gap-2">
                <Upload size={16} />
                <span>ファイルを選択</span>
                <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                />
            </label>
            {imageFile && <span className="ml-3 text-sm text-gray-500 truncate">{imageFile.name}</span>}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? (
              <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  送信中
              </>
          ) : (
              existingVm ? '追加投稿する' : '投稿する'
          )}
        </button>
      </div>
    </form>
  );
}
