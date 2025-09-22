import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const useRealtime = (table: string) => {
  const [data, setData] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      const { data: initialData } = await supabase.from(table).select();
      setData(initialData);
    };

    fetchData();

    const subscription = supabase
      .from(table)
      .on('*', (payload) => {
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
      })
      .subscribe();

    return () => {
      supabase.removeSubscription(subscription);
    };
  }, [table]);

  return data;
};

export default useRealtime;