import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const Ctx = createContext(null);

// Carga las citas una vez. Si entraste al panel en este navegador, también ves los borradores.
export function DataProvider({ children }) {
  const [state, setState] = useState({ loading: true, data: null, error: null, admin: false });

  const load = useCallback(async () => {
    try {
      const s = await api.session().catch(() => ({ admin: false }));
      const data = s.admin ? await api.adminData() : await api.publicData();
      setState({ loading: false, data, error: null, admin: !!s.admin });
    } catch (e) {
      setState({ loading: false, data: null, error: e.message, admin: false });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return <Ctx.Provider value={{ ...state, reload: load, setData: (data) => setState((s) => ({ ...s, data })) }}>{children}</Ctx.Provider>;
}

export const useData = () => useContext(Ctx);
