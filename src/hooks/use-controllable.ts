import * as React from "react"

interface UseControllableStateParams<T> {
  defaultProp?: T
  onChange?: (value: T) => void
  prop?: T
}

export function useControllableState<T>({
  defaultProp,
  onChange,
  prop,
}: UseControllableStateParams<T>): [T, (value: T) => void] {
  const [internalValue, setInternalValue] = React.useState<T>(defaultProp as T)

  const isControlled = prop !== undefined
  const value = isControlled ? (prop as T) : internalValue

  const setValue = React.useCallback(
    (next: T) => {
      if (!isControlled) setInternalValue(next)
      onChange?.(next)
    },
    [isControlled, onChange],
  )

  return [value, setValue]
}
