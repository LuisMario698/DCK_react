// Client-side API layer — safe to import in client components
// All functions use fetch() to call API routes instead of Prisma directly

import { Buque, Persona, TipoPersona, Manifiesto, ManifiestoConRelaciones, ManifiestoBasuron, ManifiestoBasuronConRelaciones } from '@/types/database';
import { FiltrosDashboard, ReportFilters } from '@/types/dashboard';

// ─── BUQUES ───────────────────────────────────────────────────────────────────

export async function getBuques(): Promise<Buque[]> {
  const res = await fetch('/api/buques');
  if (!res.ok) throw new Error('Error al obtener buques');
  return res.json();
}

export async function searchBuques(search: string): Promise<Buque[]> {
  const res = await fetch(`/api/buques?search=${encodeURIComponent(search)}`);
  if (!res.ok) throw new Error('Error al buscar buques');
  return res.json();
}

export async function createBuque(buque: Omit<Buque, 'id' | 'created_at' | 'updated_at'>): Promise<Buque> {
  const res = await fetch('/api/buques', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buque) });
  if (!res.ok) throw new Error('Error al crear buque');
  return res.json();
}

export async function updateBuque(id: number, buque: Partial<Buque>): Promise<Buque> {
  const res = await fetch(`/api/buques/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buque) });
  if (!res.ok) throw new Error('Error al actualizar buque');
  return res.json();
}

export async function deleteBuque(id: number): Promise<void> {
  const res = await fetch(`/api/buques/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar buque');
}

// ─── PERSONAS ─────────────────────────────────────────────────────────────────

export async function getPersonas(): Promise<Persona[]> {
  const res = await fetch('/api/personas');
  if (!res.ok) throw new Error('Error al obtener personas');
  return res.json();
}

export async function createPersona(persona: Omit<Persona, 'id' | 'created_at' | 'updated_at'>): Promise<Persona> {
  const res = await fetch('/api/personas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(persona) });
  if (!res.ok) throw new Error('Error al crear persona');
  return res.json();
}

export async function updatePersona(id: number, persona: Partial<Persona>): Promise<Persona> {
  const res = await fetch(`/api/personas/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(persona) });
  if (!res.ok) throw new Error('Error al actualizar persona');
  return res.json();
}

export async function deletePersona(id: number): Promise<void> {
  const res = await fetch(`/api/personas/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar persona');
}

// ─── TIPOS PERSONA ────────────────────────────────────────────────────────────

export async function getTiposPersona(): Promise<TipoPersona[]> {
  const res = await fetch('/api/tipos-persona');
  if (!res.ok) throw new Error('Error al obtener tipos de persona');
  return res.json();
}

export async function createTipoPersona(tipo: Omit<TipoPersona, 'id' | 'created_at' | 'updated_at'>): Promise<TipoPersona> {
  const res = await fetch('/api/tipos-persona', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tipo) });
  if (!res.ok) throw new Error('Error al crear tipo de persona');
  return res.json();
}

export async function updateTipoPersona(id: number, tipo: Partial<TipoPersona>): Promise<TipoPersona> {
  const res = await fetch(`/api/tipos-persona/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tipo) });
  if (!res.ok) throw new Error('Error al actualizar tipo de persona');
  return res.json();
}

export async function deleteTipoPersona(id: number): Promise<void> {
  const res = await fetch(`/api/tipos-persona/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar tipo de persona');
}

// ─── MANIFIESTOS ──────────────────────────────────────────────────────────────

export async function getManifiestos(): Promise<ManifiestoConRelaciones[]> {
  const res = await fetch('/api/manifiestos');
  if (!res.ok) throw new Error('Error al obtener manifiestos');
  return res.json();
}

export async function createManifiesto(
  manifiesto: Omit<Manifiesto, 'id' | 'created_at' | 'updated_at' | 'numero_manifiesto'>,
  residuos?: { aceite_usado: number; filtros_aceite: number; filtros_diesel: number; filtros_aire: number; basura: number; observaciones?: string },
  archivo?: File | null,
  pdfFile?: File | Blob | null,
  numeroPredefinido?: string
): Promise<Manifiesto> {
  let res: Response;
  if (archivo || pdfFile) {
    const form = new FormData();
    form.append('manifiesto', JSON.stringify(manifiesto));
    if (residuos) form.append('residuos', JSON.stringify(residuos));
    if (numeroPredefinido) form.append('numeroPredefinido', numeroPredefinido);
    if (archivo) form.append('archivo', archivo);
    if (pdfFile) form.append('pdfFile', pdfFile instanceof File ? pdfFile : new File([pdfFile], 'manifiesto.pdf', { type: 'application/pdf' }));
    res = await fetch('/api/manifiestos', { method: 'POST', body: form });
  } else {
    res = await fetch('/api/manifiestos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ manifiesto, residuos, numeroPredefinido }) });
  }
  if (!res.ok) throw new Error('Error al crear manifiesto');
  return res.json();
}

export async function updateManifiesto(
  id: number,
  manifiesto: Partial<Manifiesto>,
  residuos?: { aceite_usado: number; filtros_aceite: number; filtros_diesel: number; filtros_aire: number; basura: number; observaciones?: string }
): Promise<Manifiesto> {
  const res = await fetch(`/api/manifiestos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ manifiesto, residuos }) });
  if (!res.ok) throw new Error('Error al actualizar manifiesto');
  return res.json();
}

export async function deleteManifiesto(id: number): Promise<void> {
  const res = await fetch(`/api/manifiestos/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar manifiesto');
}

// ─── BUQUES (extras) ─────────────────────────────────────────────────────────

export async function createBuqueAutomatico(nombre: string): Promise<Buque> {
  const res = await fetch('/api/buques/automatico', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre }) });
  if (!res.ok) throw new Error('Error al crear buque automático');
  return res.json();
}

// ─── PERSONAS (extras) ────────────────────────────────────────────────────────

export async function createPersonaAutomatica(nombre: string, tipoId?: number): Promise<Persona> {
  const res = await fetch('/api/personas/automatica', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre, tipo_persona_id: tipoId ?? null }) });
  if (!res.ok) throw new Error('Error al crear persona automática');
  return res.json();
}

export async function getOrCreateTipoPersona(nombre: string): Promise<TipoPersona> {
  const res = await fetch('/api/tipos-persona/get-or-create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre }) });
  if (!res.ok) throw new Error('Error al obtener/crear tipo de persona');
  return res.json();
}

// ─── MANIFIESTOS (extras) ─────────────────────────────────────────────────────

export async function generarNumeroManifiesto(fecha: string): Promise<string> {
  const res = await fetch(`/api/manifiestos/generar-numero?fecha=${encodeURIComponent(fecha)}`);
  if (!res.ok) throw new Error('Error al generar número de manifiesto');
  const data = await res.json();
  return data.numero;
}

export async function uploadManifiestoPDF(file: File | Blob, numeroManifiesto: string): Promise<string> {
  const form = new FormData();
  form.append('file', file instanceof File ? file : new File([file], `${numeroManifiesto}.pdf`, { type: 'application/pdf' }));
  form.append('numero', numeroManifiesto);
  const res = await fetch('/api/manifiestos/upload-pdf', { method: 'POST', body: form });
  if (!res.ok) throw new Error('Error al subir PDF');
  const data = await res.json();
  return data.url;
}

// ─── BASURÓN ──────────────────────────────────────────────────────────────────

export async function getManifiestosBasuron(): Promise<ManifiestoBasuronConRelaciones[]> {
  const res = await fetch('/api/basuron');
  if (!res.ok) throw new Error('Error al obtener manifiestos basurón');
  return res.json();
}

export async function createManifiestoBasuron(
  manifiesto: Omit<ManifiestoBasuron, 'id' | 'created_at' | 'updated_at' | 'numero_ticket' | 'total_depositado'>,
  file?: File
): Promise<ManifiestoBasuron> {
  if (file) {
    const form = new FormData();
    form.append('manifiesto', JSON.stringify(manifiesto));
    form.append('archivo', file);
    const res = await fetch('/api/basuron', { method: 'POST', body: form });
    if (!res.ok) throw new Error('Error al crear manifiesto basurón');
    return res.json();
  }
  const res = await fetch('/api/basuron', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(manifiesto) });
  if (!res.ok) throw new Error('Error al crear manifiesto basurón');
  return res.json();
}

export async function deleteManifiestoBasuron(id: number): Promise<void> {
  const res = await fetch(`/api/basuron/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar manifiesto basurón');
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export async function getDashboardKPIsFiltered(filtros: FiltrosDashboard) {
  const res = await fetch('/api/dashboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'kpis', filtros }) });
  if (!res.ok) throw new Error('Error al obtener KPIs');
  return res.json();
}

export async function getComparacionPeriodoAnterior(filtros: FiltrosDashboard) {
  const res = await fetch('/api/dashboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'comparacion', filtros }) });
  if (!res.ok) throw new Error('Error al obtener comparación');
  return res.json();
}

export async function getReporteComplejo(filters: ReportFilters) {
  const res = await fetch('/api/dashboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'reporte', filters }) });
  if (!res.ok) throw new Error('Error al obtener reporte');
  return res.json();
}
