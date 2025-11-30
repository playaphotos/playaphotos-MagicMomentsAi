import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../../lib/firebase';
import { ArrowLeft, Upload, Trash2, Loader, Image as ImageIcon } from 'lucide-react';

const EventUploadManager = () => {
  const { eventId } = useParams();
  const [photos, setPhotos] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch Photos
  useEffect(() => {
    if (!eventId) return;
    const q = query(collection(db, 'photos'), where('eventId', '==', eventId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPhotos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [eventId]);

  // Handle Upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsUploading(true);
    const files = Array.from(e.target.files);
    
    let completed = 0;
    for (const file of files) {
      try {
        // Path: agency_uploads/USER_ID/EVENT_ID/TIMESTAMP_FILENAME
        const path = `agency_uploads/${auth.currentUser?.uid}/${eventId}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, path);
        
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        await addDoc(collection(db, 'photos'), {
          eventId,
          agencyId: auth.currentUser?.uid,
          originalUrl: url,
          watermarkedUrl: url, // Todo: Add watermark processing
          status: 'active',
          createdAt: serverTimestamp(),
          embedding: [] 
        });
        completed++;
        setUploadProgress((completed / files.length) * 100);
      } catch (err) {
        console.error(err);
      }
    }
    setIsUploading(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin/events" className="p-2 hover:bg-slate-200 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">Manage Photos</h1>
      </div>

      <label className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer mb-8 ${isUploading ? 'bg-indigo-50 border-indigo-300' : 'hover:bg-slate-50'}`}>
        <input type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" disabled={isUploading} />
        {isUploading ? (
          <p className="text-indigo-600 font-bold">Uploading... {Math.round(uploadProgress)}%</p>
        ) : (
          <>
            <Upload className="w-8 h-8 text-slate-400 mb-2" />
            <p className="font-medium">Click to Upload Photos</p>
          </>
        )}
      </label>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {photos.map(photo => (
          <div key={photo.id} className="aspect-square relative group bg-slate-100 rounded-lg overflow-hidden">
            <img src={photo.originalUrl} className="w-full h-full object-cover" alt="" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <button className="text-white bg-red-500 p-2 rounded-full hover:bg-red-600">
                  <Trash2 className="w-5 h-5" />
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventUploadManager;