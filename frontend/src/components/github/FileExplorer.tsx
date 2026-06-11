import React, { useState, useEffect } from 'react';
import { Folder, FolderOpen, File as FileIcon, FileCode, FileText, FileImage, Loader2, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import { CodeViewer } from './CodeViewer';

interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

interface FileExplorerProps {
  projectId: string;
}

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext || ext === filename) return <FileIcon size={16} className="text-muted-foreground" />;
  
  if (['ts', 'tsx', 'js', 'jsx', 'json', 'html', 'css', 'scss', 'py', 'java', 'go', 'rs'].includes(ext)) {
    return <FileCode size={16} className="text-blue-500" />;
  }
  if (['md', 'txt', 'csv'].includes(ext)) {
    return <FileText size={16} className="text-muted-foreground" />;
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico'].includes(ext)) {
    return <FileImage size={16} className="text-emerald-500" />;
  }
  return <FileIcon size={16} className="text-muted-foreground" />;
};

export const FileExplorer: React.FC<FileExplorerProps> = ({ projectId }) => {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [files, setFiles] = useState<GitHubFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<GitHubFile | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState<boolean>(false);
  const [pathHistory, setPathHistory] = useState<string[]>(['']);

  useEffect(() => {
    fetchPath(currentPath);
  }, [projectId, currentPath]);

  const fetchPath = async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/github/contents/${projectId}?path=${encodeURIComponent(path)}`);
      if (Array.isArray(response.data)) {
        // Sort directories first
        const sorted = response.data.sort((a, b) => {
          if (a.type === 'dir' && b.type !== 'dir') return -1;
          if (a.type !== 'dir' && b.type === 'dir') return 1;
          return a.name.localeCompare(b.name);
        });
        setFiles(sorted);
      } else {
        // It's a single file response
        setFiles([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la récupération des fichiers');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    setPathHistory([...pathHistory, path]);
    setCurrentPath(path);
    setSelectedFile(null);
    setFileContent(null);
  };

  const handleNavigateBack = () => {
    if (pathHistory.length <= 1) return;
    const newHistory = [...pathHistory];
    newHistory.pop(); // remove current
    const prevPath = newHistory[newHistory.length - 1];
    setPathHistory(newHistory);
    setCurrentPath(prevPath);
    setSelectedFile(null);
    setFileContent(null);
  };

  const handleNavigateToRoot = () => {
    setPathHistory(['']);
    setCurrentPath('');
    setSelectedFile(null);
    setFileContent(null);
  };

  const handleFileClick = async (file: GitHubFile) => {
    setSelectedFile(file);
    setLoadingFile(true);
    try {
      // In GitHub API, file content is returned base64 encoded if we request the file path
      const response = await api.get(`/github/contents/${projectId}?path=${encodeURIComponent(file.path)}`);
      if (response.data && response.data.content) {
        // decode base64
        const decoded = decodeURIComponent(escape(window.atob(response.data.content)));
        setFileContent(decoded);
      } else {
        setFileContent('Impossible de lire le contenu de ce fichier (peut-être binaire).');
      }
    } catch (err) {
      setFileContent('Erreur lors de la lecture du fichier.');
    } finally {
      setLoadingFile(false);
    }
  };

  return (
    <div className="flex flex-col h-full border border-border rounded-lg overflow-hidden bg-card">
      <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/50 text-sm overflow-x-auto whitespace-nowrap">
        <button onClick={handleNavigateToRoot} className="hover:text-primary transition-colors font-medium flex items-center">
          <Folder size={14} className="mr-1 inline" /> root
        </button>
        {currentPath.split('/').filter(Boolean).map((part, index, arr) => {
          const path = arr.slice(0, index + 1).join('/');
          return (
            <React.Fragment key={path}>
              <ChevronRight size={14} className="text-muted-foreground" />
              <button 
                onClick={() => handleNavigate(path)} 
                className="hover:text-primary transition-colors font-medium"
              >
                {part}
              </button>
            </React.Fragment>
          );
        })}
        {selectedFile && (
          <>
            <ChevronRight size={14} className="text-muted-foreground" />
            <span className="font-medium text-foreground">{selectedFile.name}</span>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden min-h-[400px]">
        {selectedFile ? (
          <div className="flex-1 overflow-y-auto bg-background p-4 relative">
            {loadingFile ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Loader2 size={24} className="animate-spin" />
              </div>
            ) : fileContent !== null ? (
              <CodeViewer content={fileContent} filename={selectedFile.name} />
            ) : null}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center p-8 text-muted-foreground"><Loader2 size={24} className="animate-spin" /></div>
            ) : error ? (
              <div className="p-4 text-sm text-destructive">{error}</div>
            ) : (
              <div className="flex flex-col">
                {currentPath !== '' && (
                  <button
                    onClick={handleNavigateBack}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm border-b border-border hover:bg-muted/50 transition-colors text-left"
                  >
                    <FolderOpen size={16} className="text-muted-foreground" />
                    <span className="font-medium text-muted-foreground">..</span>
                  </button>
                )}
                {files.map(file => (
                  <button
                    key={file.sha}
                    onClick={() => file.type === 'dir' ? handleNavigate(file.path) : handleFileClick(file)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm border-b border-border hover:bg-muted/50 transition-colors text-left"
                  >
                    {file.type === 'dir' ? (
                      <Folder size={16} className="text-primary/70 shrink-0" />
                    ) : (
                      getFileIcon(file.name)
                    )}
                    <span className="truncate hover:text-primary transition-colors">{file.name}</span>
                  </button>
                ))}
                {files.length === 0 && <div className="p-8 text-sm text-muted-foreground italic text-center">Dossier vide</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
