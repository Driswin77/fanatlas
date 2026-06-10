import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { Camera, X, Upload } from 'lucide-react';
import { fetchTeams, submitFan, uploadImageToImgBB } from '../utils/api';

const AddPinBottomSheet = ({ isOpen, onClose, location }) => {
  const [teams, setTeams] = useState([]);
  const [formData, setFormData] = useState({ nickname: '', team: '', district: '' });
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const data = await fetchTeams();
        setTeams(data);
      } catch (err) {
        console.error("Failed to load teams");
      }
    };
    if (isOpen && teams.length === 0) loadTeams();
  }, [isOpen, teams.length]);

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    let imageFile = acceptedFiles[0];

    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true
      };
      const compressedFile = await imageCompression(imageFile, options);
      setFile(compressedFile);
      setPreviewUrl(URL.createObjectURL(compressedFile));
    } catch (error) {
      console.log('Compression error', error);
      setError('Error compressing image');
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nickname || !formData.team) {
      setError('Nickname and Team are required.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      let photoUrl = '';
      if (file) {
        photoUrl = await uploadImageToImgBB(file);
      }

      await submitFan({
        ...formData,
        photoUrl,
        lat: location.lat,
        lng: location.lng
      });
      
      onClose();
      // Reset form
      setFormData({ nickname: '', team: '', district: '' });
      setFile(null);
      setPreviewUrl(null);
      
      // Notify components to update instantly without reloading the page
      window.dispatchEvent(new Event('fanUpdated'));
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error submitting pin');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[1000] backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 glass-panel rounded-t-3xl rounded-b-none p-6 z-[1001] max-h-[90vh] overflow-y-auto sm:max-w-md sm:mx-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Drop Your Pin</h2>
              <button onClick={onClose} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && <div className="bg-red-500/20 text-red-200 p-3 rounded-lg mb-4 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">UserName</label>
                <input
                  type="text"
                  maxLength="30"
                  required
                  value={formData.nickname}
                  onChange={e => setFormData({...formData, nickname: e.target.value})}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f3ff] transition-colors"
                  placeholder="Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Select Team</label>
                <select
                  required
                  value={formData.team}
                  onChange={e => setFormData({...formData, team: e.target.value})}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f3ff] transition-colors appearance-none"
                >
                  <option value="" disabled>Choose your nation</option>
                  {teams.map(t => (
                    <option key={t._id} value={t.name}>{t.flagEmoji} {t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">District/City</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={e => setFormData({...formData, district: e.target.value})}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00f3ff] transition-colors"
                  placeholder="e.g. London"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Photo</label>
                <div 
                  {...getRootProps()} 
                  className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-[#00f3ff] transition-colors bg-gray-800/30"
                >
                  <input {...getInputProps()} />
                  {previewUrl ? (
                    <div className="relative inline-block">
                      <img src={previewUrl} alt="Preview" className="h-24 w-24 object-cover rounded-full border-2 border-[#00f3ff]" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 hover:opacity-100 transition-opacity">
                        <Upload className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="bg-gray-800 p-3 rounded-full mb-2">
                        <Camera className="w-6 h-6 text-[#00f3ff]" />
                      </div>
                      <p className="text-sm text-gray-400">Tap to snap or upload</p>
                      <p className="text-xs text-gray-500 mt-1">Compressed to save data</p>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#00f3ff] text-black font-bold py-4 rounded-xl shadow-[0_0_15px_rgba(0,243,255,0.4)] hover:bg-[#00d0ff] hover:shadow-[0_0_20px_rgba(0,243,255,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {isSubmitting ? 'Planting Pin...' : 'Drop'}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddPinBottomSheet;
