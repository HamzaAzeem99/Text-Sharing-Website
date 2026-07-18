import React, { useState, useEffect } from 'react';
import { supabase } from './utils/supabase';
import logo from '../public/nobgLogo.png';
import { Menu, FileText, CheckCircle, Download, File, Image, Video, Music } from 'lucide-react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState("text");
  const [text, setText] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaName, setMediaName] = useState("");
  const [file, setFile] = useState(null);

  const [textLoading, setTextLoading] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);

  async function getPostData() {
    const { data, error } = await supabase
      .from('post')
      .select('*')
      .eq('id', 1)
      .single();

    if (data) {
      setText(data.name || "");
      setMediaUrl(data.media || "");
      setMediaName(data.file_name || "");
    }
  }

  useEffect(() => {
    getPostData();
  }, []);

  async function InsertText() {
    setTextLoading(true);
    const { error } = await supabase
      .from('post')
      .upsert({ id: 1, name: text }, { onConflict: 'id' });

    if (!error) {
      alert("Text Shared!");
      getPostData();
    }
    setTextLoading(false);
  }

  // Upload to Storage Bucket ('upload'), Delete old file, & Upsert New Media URL
 // Pure storage cleaning ke sath final InsertMedia function
async function InsertMedia() {
  if (!file) return alert("Please select a file first!");
  setMediaLoading(true);

  try {
    // URL parsing ke bajaye, direct clean DB record 'mediaName' use karein
    if (mediaName) {
      // Date.now() ke sath generate kiya gaya exact name storage bucket ko pass karein
      const { error: removeError } = await supabase.storage
        .from('upload')
        .remove([mediaName]);

      if (removeError) {
        console.error("Purani file storage se remove nahi ho saki:", removeError.message);
      }
    }

    // New file ka name generate karein
    const generatedFileName = `${Date.now()}_${file.name}`;
    
    // Storage bucket mein upload karein
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('upload')
      .upload(generatedFileName, file);

    if (uploadError) {
      alert("Upload error: " + uploadError.message);
      setMediaLoading(false);
      return;
    }

    // Public URL fetch karein
    const { data: publicUrlData } = supabase.storage
      .from('upload')
      .getPublicUrl(generatedFileName);

    const publicUrl = publicUrlData.publicUrl;

    // Database mein exact 'generatedFileName' ko 'file_name' field mein upsert karein
    const { error: dbError } = await supabase
      .from('post')
      .upsert({ 
        id: 1, 
        media: publicUrl,
        file_name: generatedFileName // Agli baar isi name se bucket se access or delete hoga
      }, { onConflict: 'id' });

    if (!dbError) {
      alert("File Shared & Space Cleaned!");
      setFile(null);
      getPostData(); // State and UI refresh
    } else {
      alert("Database error: " + dbError.message);
    }
  } catch (err) {
    console.error("Critical storage clean error:", err);
  } finally {
    setMediaLoading(false);
  }
}
  function copyTodoText(content) {
    if (!content) return;
    navigator.clipboard.writeText(content);
    alert("Copied!");
  }

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'downloaded-file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      window.open(url, '_blank');
    }
  };

  // Helper function to render modern inline previews based on file extensions
  const renderMediaPreview = (url, name) => {
    if (!url) return null;
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)) {
      return (
        <div className="media-preview-container">
          <img src={url} alt="Live Preview" className="workspace-media-img" />
        </div>
      );
    } else if (lowerUrl.match(/\.(mp4|webm|ogg)$/i)) {
      return (
        <div className="media-preview-container">
          <video src={url} controls className="workspace-media-video" />
        </div>
      );
    } else if (lowerUrl.match(/\.(mp3|wav|ogg|m4a)$/i)) {
      return (
        <div className="media-preview-container generic-doc-box">
          <Music className="preview-type-icon" size={32} />
          <audio src={url} controls className="workspace-media-audio" />
        </div>
      );
    } else {
      return (
        <div className="media-preview-container generic-doc-box">
          <File className="preview-type-icon" size={40} />
          <span className="doc-name-text">{name || "Shared Document"}</span>
        </div>
      );
    }
  };

  return (
  
    <div className='air-workspace'>
      {/* TOP HEADER */}
      <header className="air-navbar">
        <div className="nav-brand">
          <img src={logo} alt="Logo" className="nav-logo" />
          <span className="brand-text">everycode<span className="bold-text">share</span></span>
        </div>
        <nav className="nav-links">
          <span className="link-item active-link">How it works</span>
          <span className="link-item">Download</span>
          <span className="link-item">Upgrade</span>
          <span className="link-item">Feedback</span>
        </nav>
      </header>

      {/* CENTERED MAIN CONTAINER */}
      <main className="air-container-wrapper">
        <div className="air-card">

          {/* LEFT ICON TAB STRIP (USING LUCIDE ICONS) */}
          <div className="air-tabs-strip">
            <button
              className={`strip-btn ${activeTab === 'text' ? 'active' : ''}`}
              onClick={() => setActiveTab('text')}
              title="Text Share"
            >
              <Menu className="icon-graphic" size={24} />
            </button>
            <button
              className={`strip-btn ${activeTab === 'media' ? 'active' : ''}`}
              onClick={() => setActiveTab('media')}
              title="File Share"
            >
              <FileText className="icon-graphic" size={24} />
            </button>
          </div>

          {/* RIGHT CONTENT WORKSPACE */}
          <div className="air-content-workspace">
            {activeTab === 'text' ? (
              <div className="workspace-pane entry-fade">
                <h1 className="pane-title">Text</h1>
                <textarea
                  className="air-textarea"
                  placeholder="Type or paste code/text here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />

                {/* Live Output Section */}
                {text && (
                  <div className="live-status-pill">
                    <div className="pill-left-content">
                      <CheckCircle size={16} className="status-icon" />
                      <span className="pill-label">Live Preview</span>
                    </div>
                    <button className="pill-action-btn" onClick={() => copyTodoText(text)}>Copy Text</button>
                  </div>
                )}

                <div className="action-footer">
                  <button className="air-save-btn" onClick={InsertText} disabled={textLoading}>
                    {textLoading ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="workspace-pane entry-fade">
                <h1 className="pane-title">Files</h1>

                <div className="air-file-zone">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden-file-input"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                  <label htmlFor="file-upload" className="file-zone-label">
                    {file ? `Selected: ${file.name}` : "Click or Drop your files here"}
                  </label>
                </div>

                {/* Live Rich Media Preview Display (Shows before download) */}
                {mediaUrl && renderMediaPreview(mediaUrl, mediaName)}

                {/* Live Output Status Strip */}
                {mediaUrl && (
                  <div className="live-status-pill">
                    <div className="pill-left-content truncate">
                      <CheckCircle size={16} className="status-icon" />
                      <span className="pill-label truncate">{mediaName || "Cloud Asset Ready"}</span>
                    </div>
                    <button className="pill-action-btn explicit-flex" onClick={() => handleDownload(mediaUrl, mediaName)}>
                      <Download size={14} style={{ marginRight: '6px' }} /> Download
                    </button>
                  </div>
                )}

                <div className="action-footer">
                  <button className="air-save-btn" onClick={InsertMedia} disabled={mediaLoading}>
                    {mediaLoading ? "Uploading..." : "Save"}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="air-footer">
        <p>© 2026 EveryCodeShare.com</p>
      </footer>
    </div>
  );
}

export default App;