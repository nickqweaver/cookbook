import { useCallback, useState } from 'react'

type Mutation<TData, TVariables> = (v: TVariables) => TData

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
    async (variables: TVariables) => {
      try {
        setIsPending(true)
        const res = await cb(variables)
        setData({ data: res })
        return res
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Failed')
        setIsError(true)
      } finally {
        setIsPending(false)
      }
    },
    [cb],
  )

  return { data, isPending, error, isError, mutate }
}
