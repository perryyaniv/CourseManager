import client from './client';
import { ManagedListItem, Lecturer } from '../types';

export type ListType = 'course-names' | 'course-types' | 'lecturers' | 'locations';

export const getList = <T = ManagedListItem>(type: ListType) =>
  client.get<T[]>(`/managed-lists/${type}`).then((r) => r.data);

export const createItem = <T>(type: ListType, data: Partial<T>) =>
  client.post<T>(`/managed-lists/${type}`, data).then((r) => r.data);

export const updateItem = <T>(type: ListType, id: string, data: Partial<T>) =>
  client.put<T>(`/managed-lists/${type}/${id}`, data).then((r) => r.data);

export const deleteItem = (type: ListType, id: string) =>
  client.delete(`/managed-lists/${type}/${id}`).then((r) => r.data);

export const getLecturers = () => getList<Lecturer>('lecturers');
