import { useCallback, useState } from 'react'

type MutationOptions<TData> = {
  onSuccess?: (data: TData) => void
  onError?: (err: string) => void
}
type Mutation<TData, TVariables> = (
  v: TVariables,
  options?: MutationOptions<TData>,
) => TData

export function useMutation<TData, TVariables = void>(
  cb: Mutation<TData, TVariables>,
) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<{ data: TData | undefined }>({
    data: undefined,
  })
  const [isError, setIsError] = useState(false)

  const mutate = useCallback(
    async (variables: TVariables, options?: MutationOptions<TData>) => {
      try {
        setIsPending(true)
        const res = await cb(variables)
        setData({ data: res })
        options?.onSuccess?.(res)
        return res
      } catch (err) {
        console.error(err)
        const msg = err instanceof Error ? err.message : 'Failed'
        setError(msg)
        setIsError(true)
        options?.onError?.(msg)
      } finally {
        setIsPending(false)
      }
    },
    [cb],
  )

  return { data, isPending, error, isError, mutate }
}
