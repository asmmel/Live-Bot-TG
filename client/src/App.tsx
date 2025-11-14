import { useState, useEffect } from 'react';
import { useTelegram } from './hooks/useTelegram';
import { api, User, Generation, GalleryItem } from './api/client';
import './App.css';

type Tab = 'create' | 'gallery' | 'history';

function App() {
  const { webApp, isReady } = useTelegram();
  const [activeTab, setActiveTab] = useState<Tab>('create');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Create tab state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [keywords, setKeywords] = useState('');
  const [generating, setGenerating] = useState(false);

  // Gallery state
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  // History state
  const [generations, setGenerations] = useState<Generation[]>([]);

  useEffect(() => {
    if (isReady) {
      loadUserProfile();
      loadGallery();
    }
  }, [isReady]);

  useEffect(() => {
    if (activeTab === 'history' && user) {
      loadHistory();
    }
  }, [activeTab, user]);

  const loadUserProfile = async () => {
    try {
      const profile = await api.getUserProfile();
      setUser(profile);
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    }
  };

  const loadGallery = async () => {
    try {
      const items = await api.getGalleryItems();
      setGalleryItems(items);
    } catch (err: any) {
      console.error('Error loading gallery:', err);
    }
  };

  const loadHistory = async () => {
    try {
      const gens = await api.getGenerations(20);
      setGenerations(gens);
    } catch (err: any) {
      console.error('Error loading history:', err);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError('');
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage || !user) return;

    setGenerating(true);
    setError('');

    try {
      webApp?.HapticFeedback.impactOccurred('medium');

      const result = await api.createGeneration(selectedImage, keywords);

      webApp?.HapticFeedback.notificationOccurred('success');
      webApp?.showAlert('Generation started! Check the History tab to see progress.');

      // Reload user profile to update credits
      await loadUserProfile();

      // Clear form
      setSelectedImage(null);
      setPreviewUrl('');
      setKeywords('');

      // Switch to history tab
      setActiveTab('history');
    } catch (err: any) {
      console.error('Error generating:', err);
      webApp?.HapticFeedback.notificationOccurred('error');

      if (err.response?.status === 402) {
        setError('Insufficient credits. Please purchase more credits.');
      } else {
        setError(err.response?.data?.error || 'Failed to start generation');
      }
    } finally {
      setGenerating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { text: '⏳ Pending', className: 'status-pending' },
      processing: { text: '⚙️ Processing', className: 'status-processing' },
      completed: { text: '✅ Completed', className: 'status-completed' },
      failed: { text: '❌ Failed', className: 'status-failed' },
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  if (!isReady) {
    return (
      <div className="app">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '20px', color: 'var(--tg-theme-hint-color)' }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="header">
        <h1>🎬 Live Bot</h1>
        <p>Animate your photos with AI</p>
      </div>

      {user && (
        <div className="credits-info">
          <div>
            <div className="credits-label">Your Credits</div>
            <div className="credits-value">💎 {user.credits}</div>
          </div>
          <button
            onClick={() => webApp?.showAlert('Payment integration coming soon!')}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--tg-theme-button-color)',
              color: 'var(--tg-theme-button-text-color)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Buy Credits
          </button>
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create
        </button>
        <button
          className={`tab ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => setActiveTab('gallery')}
        >
          Gallery
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {activeTab === 'create' && (
        <div className="upload-section">
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
          <label htmlFor="image-upload">
            <div className={`upload-container ${previewUrl ? 'has-image' : ''}`}>
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="preview-image" />
              ) : (
                <>
                  <div className="upload-icon">📸</div>
                  <p>Click to upload a photo</p>
                  <p style={{ fontSize: '12px', color: 'var(--tg-theme-hint-color)', marginTop: '5px' }}>
                    JPEG, PNG, or WebP
                  </p>
                </>
              )}
            </div>
          </label>

          {selectedImage && (
            <>
              <input
                type="text"
                className="keywords-input"
                placeholder="Add keywords (optional): e.g., smiling, waving, dancing"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
              <button
                className="generate-button"
                onClick={handleGenerate}
                disabled={generating || !user}
              >
                {generating ? (
                  <>
                    <div className="spinner"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    ✨ Animate ({process.env.CREDITS_PER_GENERATION || 1} credit)
                  </>
                )}
              </button>
            </>
          )}
        </div>
      )}

      {activeTab === 'gallery' && (
        <div>
          <h2 className="section-title">Example Animations</h2>
          {galleryItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎨</div>
              <p>Gallery coming soon!</p>
            </div>
          ) : (
            <div className="gallery-grid">
              {galleryItems.map((item) => (
                <div key={item.id} className="gallery-item">
                  <video
                    src={item.video_url}
                    poster={item.thumbnail_url}
                    controls
                    loop
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          <h2 className="section-title">Your Generations</h2>
          {generations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📜</div>
              <p>No generations yet</p>
              <p style={{ fontSize: '14px', marginTop: '10px' }}>
                Upload a photo to get started!
              </p>
            </div>
          ) : (
            <div className="history-list">
              {generations.map((gen) => {
                const badge = getStatusBadge(gen.status);
                return (
                  <div key={gen.id} className="history-item">
                    {gen.video_url && (
                      <video
                        src={gen.video_url}
                        className="history-thumbnail"
                        controls
                      />
                    )}
                    <div className="history-info">
                      <span className={`history-status ${badge.className}`}>
                        {badge.text}
                      </span>
                      {gen.keywords && (
                        <div className="history-keywords">
                          Keywords: {gen.keywords}
                        </div>
                      )}
                      <div className="history-keywords">
                        {new Date(gen.created_at).toLocaleString()}
                      </div>
                      {gen.error_message && (
                        <div style={{ color: '#991b1b', fontSize: '12px', marginTop: '5px' }}>
                          Error: {gen.error_message}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
