import { useState } from 'react';

const KEY = 'mv-charts';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch (_) {
    return {};
  }
}

function persist(charts) {
  try {
    localStorage.setItem(KEY, JSON.stringify(charts));
  } catch (_) {}
}

export function useSavedCharts() {
  const [charts, setCharts] = useState(load);

  function save(id, name, code) {
    setCharts(prev => {
      const next = { ...prev, [id]: { name, code, savedAt: Date.now() } };
      persist(next);
      return next;
    });
  }

  function remove(id) {
    setCharts(prev => {
      const next = { ...prev };
      delete next[id];
      persist(next);
      return next;
    });
  }

  return { charts, save, remove };
}
