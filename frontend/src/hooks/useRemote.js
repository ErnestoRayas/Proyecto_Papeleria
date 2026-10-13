import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';

export function useRemote(path) {
  const [data, setData] = useState([]), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setError(''); setLoading(true);
    try { setData(await api(path)); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return { data, error, loading, load };
}
