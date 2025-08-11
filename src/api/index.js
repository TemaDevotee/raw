/*
 * Centralised API client for the Trickster frontend.  This module
 * exposes simple methods (get, post, patch, del) that proxy HTTP
 * requests to the mock back‑end.  It automatically attaches the
 * current workspace identifier to scoped resources (chats, teams,
 * connections) and shows toast notifications on failures.  The
 * implementation uses the native fetch API instead of axios to keep
 * dependencies minimal.
 */

import { workspaceStore } from '@/stores/workspaceStore';
import { showToast } from '@/stores/toastStore';

const RAW_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Build a full request URL.  When the path begins with a scoped
 * resource (e.g. `/chats`, `/teams`, `/connections`) the current
 * workspaceId is appended as a query parameter.  Additional params
 * supplied by callers are merged in.
 *
 * @param {string} path The relative endpoint (e.g. `/chats`)
 * @param {Object} params Optional query parameters
 */
function buildUrl(path, params = {}) {
  const base = RAW_BASE.startsWith('http') ? RAW_BASE : `${window.location.origin}${RAW_BASE}`;
  const url = new URL(base + path);
  // Automatically attach workspaceId for scoped resources
  const scopedPrefixes = ['/chats', '/teams', '/connections'];
  if (scopedPrefixes.some((p) => path.startsWith(p))) {
    const wsId = workspaceStore.state.currentWorkspaceId;
    if (wsId) {
      url.searchParams.set('workspaceId', wsId);
    }
  }
  // Append caller provided params
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.set(key, params[key]);
    }
  });
  return url.toString();
}

async function request(method, path, { params, data, headers } = {}) {
  const url = buildUrl(path, params);
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  if (data !== undefined) {
    options.body = JSON.stringify(data);
  }
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text();
      let message;
      try {
        const json = JSON.parse(text);
        message = json.error || res.statusText;
      } catch {
        message = res.statusText;
      }
      // Show toast on error (throttling is handled by showToast internally)
      showToast(message || 'Ошибка сервера', 'error');
      throw new Error(message);
    }
    // Attempt to parse JSON if possible
    const contentType = res.headers.get('content-type') || '';
    let payload;
    if (contentType.includes('application/json')) {
      payload = await res.json();
    } else {
      payload = await res.text();
    }
    // Mirror axios semantics: return an object with a data property
    return { data: payload };
  } catch (err) {
    // Log unexpected errors and surface toasts
    console.error('API request failed', err);
    if (!err.silent) {
      showToast(err.message || 'Network error', 'error');
    }
    throw err;
  }
}

export default {
  get(path, config = {}) {
    return request('GET', path, config);
  },
  post(path, data = {}, config = {}) {
    return request('POST', path, { ...config, data });
  },
  patch(path, data = {}, config = {}) {
    return request('PATCH', path, { ...config, data });
  },
  delete(path, config = {}) {
    return request('DELETE', path, config);
  },
};