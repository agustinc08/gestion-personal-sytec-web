import React, { FormEvent, useEffect, useState } from 'react';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { projectsApi } from '../api/projects.api';
import { ProjectComment } from '../types';

export default function ProjectComments({ projectId }: { projectId: string }) {
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const load = () => projectsApi.comments(projectId).then(setComments);
  useEffect(() => { load(); }, [projectId]);
  const submit = async (event: FormEvent) => { event.preventDefault(); if (!message.trim()) return; setSaving(true); try { setComments(await projectsApi.addComment(projectId, message.trim())); setMessage(''); } finally { setSaving(false); } };
  const remove = async (id: string) => { await projectsApi.removeComment(projectId, id); await load(); };
  return <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <h4 className="mb-4 flex items-center gap-2 font-bold text-slate-900"><MessageSquare className="h-4 w-4 text-indigo-600" /> Comentarios internos</h4>
    <form onSubmit={submit} className="flex gap-2"><textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} rows={2} placeholder="Agregar un comentario interno..." className="min-w-0 flex-1 rounded-xl border border-slate-200 p-3 text-sm" /><button disabled={saving || !message.trim()} className="self-end rounded-xl bg-indigo-600 p-3 text-white disabled:opacity-40"><Send className="h-4 w-4" /></button></form>
    <div className="mt-4 space-y-3">{comments.map((comment) => <article key={comment.id} className="rounded-xl bg-slate-50 p-3"><div className="flex justify-between gap-3"><div><strong className="text-xs">{comment.authorName}</strong><time className="ml-2 text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleString('es-AR')}</time></div>{comment.canDelete && <button type="button" onClick={() => remove(comment.id)} title="Eliminar comentario" className="text-slate-400 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>}</div><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{comment.message}</p></article>)}{comments.length === 0 && <p className="py-3 text-center text-xs text-slate-400">Sin comentarios</p>}</div>
  </section>;
}
