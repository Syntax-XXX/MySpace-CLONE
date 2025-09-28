import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabaseClient';

const useRealtime = (table: string) => {
  const [data, setData] = useState<any[]>([]);
  const supabase = getSupabaseClient();
  
  useEffect(() => {
    if (!supabase) return;

    const fetchData = async () => {
      const { data: initialData } = await supabase.from(table).select();
      setData(initialData || []);
    };

    fetchData();

    const channel = supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              setData((prev) => [...prev, payload.new]);
              break;
            case 'UPDATE':
              setData((prev) =>
                prev.map((item) => (item.id === payload.new.id ? payload.new : item))
              );
              break;
            case 'DELETE':
              setData((prev) => prev.filter((item) => item.id !== payload.old.id));
              break;
            default:
              break;
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [table, supabase]);

  return data;
};

export default useRealtime;