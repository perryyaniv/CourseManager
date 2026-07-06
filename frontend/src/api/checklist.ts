import client from './client';
import { ChecklistEntry, ChecklistItem } from '../types';

export const getChecklistItems = () =>
  client.get<ChecklistItem[]>('/checklist/items').then((r) => r.data);

export const createChecklistItem = (data: Partial<ChecklistItem>) =>
  client.post<ChecklistItem>('/checklist/items', data).then((r) => r.data);

export const updateChecklistItem = (id: string, data: Partial<ChecklistItem>) =>
  client.put<ChecklistItem>(`/checklist/items/${id}`, data).then((r) => r.data);

export const deleteChecklistItem = (id: string) =>
  client.delete(`/checklist/items/${id}`).then((r) => r.data);

export const reorderChecklistItems = (items: { id: string; order: number }[]) =>
  client.post('/checklist/items/reorder', { items }).then((r) => r.data);

export const getCourseChecklist = (courseId: string) =>
  client.get<ChecklistEntry[]>(`/checklist/course/${courseId}`).then((r) => r.data);

export const toggleChecklistItem = (courseId: string, itemId: string, checked: boolean) =>
  client.patch(`/checklist/course/${courseId}/${itemId}`, { checked }).then((r) => r.data);
