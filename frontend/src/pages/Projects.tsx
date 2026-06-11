import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreVertical, Folder, X } from 'lucide-react';
import api from '../api/axios';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/card';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../components/ui/dropdown-menu';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { GithubRepoSelectModal } from '../components/GithubRepoSelectModal';
interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  status?: string;
  createdAt: string;
}

const getStatusBadge = (status?: string, t?: any) => {
  if (!t) return null;
  switch (status) {
    case 'not_started': return <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">{t('projects.statusNotStarted')}</span>;
    case 'active': return <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">{t('projects.statusActive')}</span>;
    case 'paused': return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">{t('projects.statusPaused')}</span>;
    case 'completed': return <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">{t('projects.statusCompleted')}</span>;
    default: return null;
  }
};

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({ name: '', description: '', color: '#185FA5' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  useEffect(() => {
    let isMounted = true;
    const fetchProjects = async () => {
      try {
        const response = await api.get('/projects');
        if (isMounted) setProjects(response.data);
      } catch (error) {
        console.error("Error fetching projects", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchProjects();
    
    return () => { isMounted = false; };
  }, [queryClient]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error("Error fetching projects", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post('/projects', newProject);
      setProjects([res.data, ...projects]);
      setIsModalOpen(false);
      setNewProject({ name: '', description: '', color: '#185FA5' });
    } catch (error) {
      console.error("Failed to create project", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    setProjectToDelete(projectId);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      await api.delete(`/projects/${projectToDelete}`);
      setProjects(projects.filter(p => p.id !== projectToDelete));
      setProjectToDelete(null);
    } catch (error) {
      console.error("Failed to delete project", error);
    }
  };

  if (loading) {
    return <div className="flex h-full w-full items-center justify-center text-muted-foreground">{t('projects.loading')}</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-10">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">{t('projects.title')}</h1>
          <p className="text-muted-foreground">{t('projects.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2" onClick={() => setIsGithubModalOpen(true)}>
            <Folder size={18} />
            <span>{t('projects.syncGithub', 'Importer depuis GitHub')}</span>
          </Button>
          <Button className="flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            <span>{t('projects.newProject')}</span>
          </Button>
        </div>
      </header>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 border border-dashed rounded-xl bg-muted/20">
          <Folder size={48} className="text-muted-foreground/50" />
          <h3 className="text-lg font-medium text-foreground">{t('projects.noProjects')}</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">{t('projects.noProjectsDesc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="flex flex-col overflow-hidden bg-background">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" 
                  style={{ backgroundColor: project.color || 'var(--primary)' }}
                >
                  <Folder size={20} className="text-white" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <MoreVertical size={18} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}`)}>
                      {t('projects.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteProject(project.id)} className="text-destructive">
                      {t('projects.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="flex-1 pt-4">
                <h3 className="text-xl font-semibold mb-2 line-clamp-1">{project.name}</h3>
                <div className="mb-2">
                  {getStatusBadge(project.status, t)}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{project.description || t('projects.noDescription')}</p>
              </CardContent>
              <CardFooter className="border-t bg-muted/20 flex items-center justify-between py-3">
                <span className="text-xs text-muted-foreground">
                  {t('projects.created')} {new Date(project.createdAt).toLocaleDateString()}
                </span>
                <Button variant="secondary" size="sm" onClick={() => navigate(`/projects/${project.id}`)}>{t('projects.view')}</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border shadow-2xl rounded-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <header className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-lg font-semibold">{t('projects.modalCreateTitle')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </header>
            <form onSubmit={handleCreateProject} className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('projects.modalNameLabel')}</label>
                <input 
                  required
                  type="text" 
                  value={newProject.name}
                  onChange={e => setNewProject({...newProject, name: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={t('projects.modalNamePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('projects.modalDescLabel')}</label>
                <textarea 
                  value={newProject.description}
                  onChange={e => setNewProject({...newProject, description: e.target.value})}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={t('projects.modalDescPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('projects.modalColorLabel')}</label>
                <div className="flex gap-2">
                  {['#185FA5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#64748B'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewProject({...newProject, color})}
                      className={`w-8 h-8 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background transition-all ${newProject.color === color ? 'ring-2 ring-primary scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>{t('projects.modalCancel')}</Button>
                <Button type="submit" disabled={!newProject.name.trim() || isSubmitting}>
                  {isSubmitting ? t('projects.modalCreating') : t('projects.modalCreateBtn')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border shadow-2xl rounded-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 p-6 space-y-4">
            <h3 className="text-lg font-semibold">{t('projects.deleteConfirmTitle')}</h3>
            <p className="text-sm text-muted-foreground">{t('projects.deleteConfirmDesc')}</p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setProjectToDelete(null)}>
                {t('projects.cancel')}
              </Button>
              <Button variant="destructive" onClick={confirmDeleteProject}>
                {t('projects.ok')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <GithubRepoSelectModal 
        isOpen={isGithubModalOpen}
        onClose={() => setIsGithubModalOpen(false)}
        onImportSuccess={fetchProjects}
      />
    </div>
  );
};

export default Projects;
