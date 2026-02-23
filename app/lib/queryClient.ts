import { api } from '@/lib/api';
import { QueryClient, QueryFunction, QueryKey } from '@tanstack/react-query';

const defaultQueryFunction: QueryFunction<unknown, QueryKey> = async ({
  queryKey: [url, data, method],
}) => {
  const stringUrl = String(url);

  return api
    .request({
      method: method ? String(method) : 'GET',
      url: stringUrl,
      ...(method === 'POST' ? { data } : { params: data }),
    })
    .then(({ data }) => data);
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 0,
      refetchOnMount: 'always',
      refetchOnWindowFocus: false,
      queryFn: defaultQueryFunction,
    },
  },
});
