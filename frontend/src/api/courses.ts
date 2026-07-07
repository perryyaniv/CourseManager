import client from './client';
import { Course, PaginatedResponse, CourseFilters } from '../types';

export const getCourses = (filters: CourseFilters) =>
  client.get<PaginatedResponse<Course>>('/courses', { params: filters }).then((r) => r.data);

export const getCourse = (id: string) =>
  client.get<Course>(`/courses/${id}`).then((r) => r.data);

export const createCourse = (data: Partial<Course>) =>
  client.post<Course>('/courses', data).then((r) => r.data);

export const updateCourse = (id: string, data: Partial<Course>) =>
  client.put<Course>(`/courses/${id}`, data).then((r) => r.data);

export const deleteCourse = (id: string) =>
  client.delete(`/courses/${id}`).then((r) => r.data);

export const cloneCourse = (id: string) =>
  client.post<Course>(`/courses/${id}/clone`).then((r) => r.data);

export const addNote = (id: string, type: string, content: string) =>
  client.post<Course>(`/courses/${id}/notes`, { type, content }).then((r) => r.data);

export const deleteNote = (courseId: string, noteId: string) =>
  client.delete<Course>(`/courses/${courseId}/notes/${noteId}`).then((r) => r.data);
