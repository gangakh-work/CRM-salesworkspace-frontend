import { SearchBox, type SearchBoxProps } from '@/components/ui/search-box'
import { cn } from '@/lib/utils'

export interface SearchBarProps extends SearchBoxProps {
  className?: string
}

export function SearchBar({ className, containerClassName, ...props }: SearchBarProps) {
  return (
    <div className={cn('w-full max-w-md', className)}>
      <SearchBox containerClassName={cn('w-full', containerClassName)} {...props} />
    </div>
  )
}
