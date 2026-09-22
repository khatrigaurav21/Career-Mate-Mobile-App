import { fetch as expoFetch } from 'expo/fetch';
import { File } from 'expo-file-system';
import { API_BASE_URL } from '@/lib/config';

export type Profile = {
  profile_id: string;
  cv_markdown: string;
  target_roles: string[] | null;
  preferences: Record<string, unknown> | null;
};

export type JobSummary = {
  job_id: string;
  company: string | null;
  title: string | null;
  score: number | null;
  status: string;
};

export type JobDetail = JobSummary & {
  report: Record<string, string>;
  [key: string]: unknown;
};

export type Session = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: string;
  email: string;
};

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
};

let tokenGetter: (() => string | null) | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setTokenGetter(getter: () => string | null) {
  tokenGetter = getter;
}

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;

  constructor(status: number, data: Record<string, unknown>) {
    super(
      typeof data.detail === 'string'
        ? data.detail
        : typeof data.message === 'string'
          ? data.message
          : 'Something went wrong. Please try again.',
    );
    this.status = status;
    this.data = data;
  }
}

async function request<T>(
  path: string,
  { method = 'GET', body, token, headers = {} }: RequestOptions = {},
): Promise<T> {
  const authToken = token ?? tokenGetter?.() ?? null;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body && !(body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    body:
      body && !(body instanceof FormData) ? JSON.stringify(body) : (body as BodyInit),
  });
  const text = await response.text();
  let data: Record<string, unknown> = {};
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = { message: text };
    }
  }
  if (response.status === 401) {
    unauthorizedHandler?.();
  }
  if (!response.ok) {
    throw new ApiError(response.status, data);
  }
  return data as T;
}

async function upload(path: string, field: string, uri: string, name: string, type?: string) {
  const form = new FormData();
  const file = new File(uri);
  form.append(field, file as unknown as Blob);
  // No Content-Type here on purpose: fetch sets multipart/form-data itself
  // with the boundary parameter the server's multipart parser needs to
  // split fields apart. Setting it manually (even to the same-looking
  // string) omits that boundary and the upload fails server-side.
  return request<{ profile_id: string; cv_markdown: string }>(path, {
    method: 'POST',
    body: form,
    headers: {
      ...(type ? { 'X-File-Type': type } : {}),
      ...(name ? { 'X-File-Name': name } : {}),
    },
  });
}

export const api = {
  sendMagicLink: (email: string) =>
    request<{ message: string }>('/auth/magic-link', {
      method: 'POST',
      body: { email },
    }),
  verify: (email: string, code: string) =>
    request<Session>('/auth/verify', {
      method: 'POST',
      body: { email, code },
    }),
  getProfile: (token?: string | null) => request<Profile>('/profile', { token }),
  uploadProfile: (uri: string, name: string, type?: string) =>
    upload('/profile/upload', 'resume_file', uri, name, type),
  pasteProfile: (cv_markdown: string) =>
    request<{ profile_id: string; cv_markdown: string }>('/profile/paste', {
      method: 'POST',
      body: { cv_markdown },
    }),
  intakeProfile: (answers: Record<string, unknown>) =>
    request<{ profile_id: string; cv_markdown: string }>('/profile/intake', {
      method: 'POST',
      body: { answers },
    }),
  getPipeline: () =>
    request<{ jobs: JobSummary[] }>('/pipeline'),
  evaluateUrl: (job_url: string) =>
    request<{ job_id: string; score: number; report: Record<string, string> }>(
      '/evaluate',
      { method: 'POST', body: { job_url } },
    ),
  evaluateText: (job_description: string) =>
    request<{ job_id: string; score: number; report: Record<string, string> }>(
      '/evaluate',
      { method: 'POST', body: { job_description } },
    ),
  evaluateFile: (uri: string, name: string, type?: string) =>
    (async () => {
      const form = new FormData();
      const file = new File(uri);
      form.append('job_file', file as unknown as Blob);
      return request<{ job_id: string; score: number; report: Record<string, string> }>(
        '/evaluate',
        {
          method: 'POST',
          body: form,
          headers: {
            ...(type ? { 'X-File-Type': type } : {}),
            ...(name ? { 'X-File-Name': name } : {}),
          },
        },
      );
    })(),
  getJob: (id: string) => request<JobDetail>(`/jobs/${encodeURIComponent(id)}`),
  generateCv: (job_id: string) =>
    request<{
      pdf_url: string;
      tailored: boolean;
      page_count: number;
      ats_score: number;
      ats_grade: string;
      warnings: string[];
    }>('/cv/generate', { method: 'POST', body: { job_id } }),
  generateCoverLetter: (job_id: string) =>
    request<{
      pdf_url: string;
      page_count: number;
      word_count: number;
      warnings: string[];
    }>('/cover-letter/generate', { method: 'POST', body: { job_id } }),
};

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isFallbackToPaste(error: unknown) {
  return isApiError(error) && error.status === 422 && error.data.fallback === 'paste_text';
}

export function getDocumentUrl(detail: JobDetail, kind: 'cv' | 'cover') {
  // GET /jobs/:id returns exactly these two top-level keys — pdf_url for
  // the CV, cover_letter_url for the cover letter. No nesting, no
  // alternate names.
  const key = kind === 'cv' ? 'pdf_url' : 'cover_letter_url';
  const url = detail[key];
  return typeof url === 'string' ? url : null;
}

export async function openWithExpoFetch(url: string) {
  return expoFetch(url);
}