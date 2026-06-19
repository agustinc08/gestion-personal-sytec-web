import { LicenseArticle, LicenseArticleField } from '../types';
import { api } from './client';

export const licenseArticlesApi = {
  all: async (includeInactive = false) => (await api.get<LicenseArticle[]>('/license-articles', { params: { includeInactive } })).data,
  create: async (payload: Partial<LicenseArticle>) => (await api.post<LicenseArticle>('/license-articles', payload)).data,
  update: async (id: string, payload: Partial<LicenseArticle>) => (await api.patch<LicenseArticle>(`/license-articles/${id}`, payload)).data,
  remove: async (id: string) => (await api.delete(`/license-articles/${id}`)).data,
  uploadTemplate: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('template', file);
    return (await api.post<LicenseArticle>(`/license-articles/${id}/template`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
  },
  addField: async (articleId: string, payload: Partial<LicenseArticleField>) => (await api.post<LicenseArticleField>(`/license-articles/${articleId}/fields`, payload)).data,
  updateField: async (id: string, payload: Partial<LicenseArticleField>) => (await api.patch<LicenseArticleField>(`/license-article-fields/${id}`, payload)).data,
  removeField: async (id: string) => (await api.delete(`/license-article-fields/${id}`)).data,
  renderLicensePdf: async (licenseId: string, values: Record<string, string>) => {
    const response = await api.post(`/licenses/${licenseId}/generate-pdf`, { values }, { responseType: 'blob' });
    return response.data as Blob;
  },
  renderArticlePdf: async (articleId: string, values: Record<string, string>) => {
    const response = await api.post(`/license-articles/${articleId}/render-pdf`, { values }, { responseType: 'blob' });
    return response.data as Blob;
  },
};
