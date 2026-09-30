(() => {
  'use strict';
  const keys = new Set(['classicPickVoiceEnabled', 'classicVoiceVolume', 'classicPickVoiceLocale']);
  const native = window.__LOLCLASSIC_CONFIG__?.durableVoicePreferences === true;
  function request(operation, key, value) {
    if (!keys.has(key)) throw new Error('Unsupported voice preference');
    const payload = {operation, key};
    if (value !== undefined) payload.value = String(value);
    const result = JSON.parse(window.prompt('lolclassic:voice-preference:v1', JSON.stringify(payload)) || '{}');
    if (result.ok !== true) throw new Error('Voice preference was not saved');
    return result.value;
  }
  const get = (key, fallback) => {
    if (native) {
      const saved = request('read', key);
      if (saved !== null) return saved;
    }
    try { return localStorage.getItem(key) ?? fallback; } catch (_) { return fallback; }
  };
  const set = (key, value) => {
    if (!keys.has(key)) return false;
    try {
      if (native) request('write', key, value); // commit finishes before the setting handler returns
      try { localStorage.setItem(key, String(value)); } catch (error) { if (!native) throw error; }
      return true;
    } catch (_) { return false; }
  };
  const remove = key => {
    if (!keys.has(key)) return false;
    try {
      if (native) request('remove', key);
      localStorage.removeItem(key);
      return true;
    } catch (_) { return false; }
  };
  window.ClassicPreferenceStore = Object.freeze({get, set, remove});
})();
