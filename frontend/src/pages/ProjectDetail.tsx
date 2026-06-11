import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GitBranch as Github, Folder, ArrowLeft, GitCommit, Link as LinkIcon, Loader2, FileCode, Users, UserPlus, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card';
import { FileExplorer } from '../components/github/FileExplorer';
import { TaskDependencyGraph } from '../components/projects/TaskDependencyGraph';
import { ProjectPlanning } from '../components/projects/ProjectPlanning';
import { GithubImportModal } from '../components/GithubImportModal';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  status?: string;
  githubRepoOwner?: string;
  githubRepoName?: string;
}

interface Commit {
  hash: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [project, setProject] = useState<Project | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [repoOwner, setRepoOwner] = useState('');
  const [repoName, setRepoName] = useState('');
  const [linkError, setLinkError] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [memberError, setMemberError] = useState('');
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);

  useEffect(() => {
    const fetchProjectAndCommits = async () => {
      try {
        const [projRes, commitsRes, membersRes] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get(`/github/commits/${id}`),
          api.get(`/projects/${id}/members`)
        ]);
        setProject(projRes.data);
        setCommits(commitsRes.data || []);
        setMembers(membersRes.data || []);
      } catch (error) {
        console.error("Failed to load project details", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchProjectAndCommits();
  }, [id]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail) return;
    setMemberError('');
    try {
      const { data } = await api.post(`/projects/${id}/members`, { email: newMemberEmail });
      setMembers([...members, data]);
      setNewMemberEmail('');
    } catch (err: any) {
      console.error('Failed to add member', err);
      if (err.response?.status === 404) {
        setMemberError(t('projectDetail.errorUserNotFound'));
      } else if (err.response?.status === 400) {
        setMemberError(t('projectDetail.errorUserExists'));
      } else {
        setMemberError(t('projectDetail.errorAddMember'));
      }
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      setMembers(members.filter(m => m.userId !== userId));
    } catch (err) {
      console.error('Failed to remove member', err);
    }
  };

  const handleLinkRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLinking(true);
    setLinkError('');
    try {
      await api.post(`/github/link/${id}`, { owner: repoOwner, repo: repoName });
      setProject({ ...project!, githubRepoOwner: repoOwner, githubRepoName: repoName });
      // Fetch commits immediately after linking
      const commitsRes = await api.get(`/github/commits/${id}`);
      setCommits(commitsRes.data || []);
    } catch (err: any) {
      setLinkError(err.response?.data?.message || t('projectDetail.errorLinkRepo'));
    } finally {
      setIsLinking(false);
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center text-muted-foreground">{t('projectDetail.loading')}</div>;
  if (!project) return <div className="flex h-full items-center justify-center text-destructive">{t('projectDetail.notFound')}</div>;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-10">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4 w-full">
          <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
            <ArrowLeft size={20} />
          </Button>
          <div className="flex items-center gap-3 w-full">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: project.color || 'var(--primary)' }}>
              <Folder size={20} className="text-white" />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <input 
                value={project.name}
                onChange={async (e) => {
                  setProject({ ...project, name: e.target.value });
                  api.patch(`/projects/${id}`, { name: e.target.value }).catch(console.error);
                }}
                className="text-2xl font-bold tracking-tight bg-transparent border-none outline-none focus:ring-1 focus:ring-ring rounded px-1 -ml-1 w-full max-w-md"
                placeholder={t('projectDetail.namePlaceholder')}
              />
              <input 
                value={project.description || ''}
                onChange={async (e) => {
                  setProject({ ...project, description: e.target.value });
                  api.patch(`/projects/${id}`, { description: e.target.value }).catch(console.error);
                }}
                className="text-sm text-muted-foreground bg-transparent border-none outline-none focus:ring-1 focus:ring-ring rounded px-1 -ml-1 w-full max-w-xl"
                placeholder={t('projectDetail.descPlaceholder')}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Github size={20} /> {t('projectDetail.githubIntegration')}</CardTitle>
              <CardDescription>{t('projectDetail.githubDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {!project.githubRepoOwner || !project.githubRepoName ? (
                <form onSubmit={handleLinkRepo} className="flex items-end gap-4 p-4 border border-dashed border-border rounded-xl bg-muted/20">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium">{t('projectDetail.ownerLabel')}</label>
                    <input 
                      required
                      value={repoOwner}
                      onChange={e => setRepoOwner(e.target.value)}
                      placeholder={t('projectDetail.ownerPlaceholder')}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium">{t('projectDetail.repoLabel')}</label>
                    <input 
                      required
                      value={repoName}
                      onChange={e => setRepoName(e.target.value)}
                      placeholder={t('projectDetail.repoPlaceholder')}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <Button type="submit" disabled={isLinking} className="gap-2">
                    {isLinking ? <Loader2 size={16} className="animate-spin" /> : <LinkIcon size={16} />}
                    {t('projectDetail.linkRepoBtn')}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Github size={18} />
                      <span className="font-medium">{project.githubRepoOwner}/{project.githubRepoName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">{t('projectDetail.connected')}</span>
                      <Button variant="outline" size="sm" onClick={() => setIsGithubModalOpen(true)}>
                        Importer Issues
                      </Button>
                    </div>
                  </div>

                  <h4 className="font-semibold mt-6 mb-2">{t('projectDetail.recentCommits')}</h4>
                  {commits.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">{t('projectDetail.noCommits')}</p>
                  ) : (
                    <div className="space-y-3">
                      {commits.map(commit => (
                        <a key={commit.hash} href={commit.url} target="_blank" rel="noreferrer" className="block">
                          <div className="flex flex-col gap-1 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium flex items-center gap-1.5"><GitCommit size={14} className="text-muted-foreground" /> {commit.message}</span>
                              <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{commit.hash}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                              <span>{commit.author}</span>
                              <span>{new Date(commit.date).toLocaleString()}</span>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
                  {linkError && <p className="text-sm text-destructive mt-3">{linkError}</p>}
                </CardContent>
              </Card>
            </div>
    
            <div className="col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('projectDetail.about')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{t('projectDetail.currentStatus')}</p>
                  <select 
                    value={project.status || 'active'}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      try {
                        await api.patch(`/projects/${id}`, { status: newStatus });
                        setProject({ ...project, status: newStatus });
                      } catch (err) {
                        console.error('Failed to update status', err);
                      }
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="not_started">{t('projects.statusNotStarted')}</option>
                    <option value="active">{t('projects.statusActive')}</option>
                    <option value="paused">{t('projects.statusPaused')}</option>
                    <option value="completed">{t('projects.statusCompleted')}</option>
                  </select>
                </CardContent>
              </Card>

              <ProjectPlanning projectId={id!} />

              <TaskDependencyGraph projectId={id!} />

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users size={20} /> {t('projectDetail.teamMembers')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {members.map(member => (
                      <div key={member.id} className="flex justify-between items-center text-sm border border-border p-2 rounded-md">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-medium text-xs">
                            {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                          </div>
                          <span>{member.user.name || member.user.email}</span>
                          {member.role === 'owner' && <span className="text-[10px] uppercase bg-muted px-1.5 py-0.5 rounded ml-1">Owner</span>}
                        </div>
                        {member.role !== 'owner' && (
                          <button onClick={() => handleRemoveMember(member.userId)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddMember} className="flex flex-col gap-2 pt-2 border-t border-border">
                    <div className="flex gap-2">
                      <input 
                        type="email"
                        required
                        placeholder={t('projectDetail.emailPlaceholder')}
                        value={newMemberEmail}
                        onChange={e => setNewMemberEmail(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      />
                      <Button type="submit" size="sm" variant="secondary">
                        <UserPlus size={16} />
                      </Button>
                    </div>
                    {memberError && <p className="text-xs text-destructive">{memberError}</p>}
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {project.githubRepoOwner && project.githubRepoName && (
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileCode size={20} /> {t('projectDetail.fileExplorer')}</CardTitle>
                  <CardDescription>{t('projectDetail.fileExplorerDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-6 sm:pt-0">
                  <FileExplorer projectId={id!} />
                </CardContent>
              </Card>
            </div>
          )}

          {project && (
            <GithubImportModal 
              isOpen={isGithubModalOpen} 
              onClose={() => setIsGithubModalOpen(false)} 
              projectId={project.id} 
              onImportSuccess={() => {
                // Force reload ProjectPlanning tasks or show a toast
                window.location.reload();
              }} 
            />
          )}
        </div>
    );
};

export default ProjectDetail;
