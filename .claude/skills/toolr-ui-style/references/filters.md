# Filter Components Reference

Reusable filter patterns for lists and dashboards in toolr-suite apps.

## Table of Contents
- [Filter Bar Layout](#filter-bar-layout)
- [FilterDropdown (Basic)](#filterdropdown-basic)
- [FilterDropdown with Search](#filterdropdown-with-search)
- [Filter State Management](#filter-state-management)
- [Filter Logic](#filter-logic)
- [Click Outside Detection](#click-outside-detection)
- [Clear Button Pattern](#clear-button-pattern)

---

## Filter Bar Layout

Standard filter bar layout with search input and filter dropdowns.

```tsx
{/* Filter bar - wraps on smaller screens */}
<div className="flex flex-wrap items-center gap-2">
  {/* Search input */}
  <div className="relative">
    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
    <input
      type="search"
      placeholder="Search..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="h-[26px] pl-7 pr-3 w-36 text-xs rounded-lg bg-gray-900 border border-gray-700
        text-[#cdd6f4] placeholder-gray-500 focus:outline-none focus:border-blue-500"
    />
  </div>

  {/* Spacer pushes filters right */}
  <div className="flex-1" />

  {/* Filter dropdowns */}
  <StatusSelect value={statusFilter} onChange={setStatusFilter} />
  {platforms.length > 1 && (
    <PlatformSelect value={platformFilter} platforms={platforms} onChange={setPlatformFilter} />
  )}
  <RepoSelect value={repoFilter} repositories={repos} onChange={setRepoFilter} />
  <UserSelect value={authorFilter} users={authors} onChange={setAuthorFilter} />

  {/* Reset filters - only show when any filter is active */}
  {hasActiveFilters && (
    <IconButton
      icon={X}
      variant="danger"
      size="sm"
      tooltip="Clear all filters"
      onClick={resetAllFilters}
    />
  )}

  {/* Action buttons */}
  <IconButton icon={RefreshCw} size="sm" onClick={refresh} />
</div>
```

---

## FilterDropdown (Basic)

Simple dropdown for small option sets (3-10 items).

```tsx
interface FilterDropdownProps<T extends string> {
  value: T
  options: { value: T; label: string; icon?: ReactNode }[]
  onChange: (value: T) => void
  placeholder: string
  allLabel?: string // Default: "All {placeholder}s"
}

function FilterDropdown<T extends string>({
  value,
  options,
  onChange,
  placeholder,
  allLabel,
}: FilterDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isFiltered = value !== 'all'
  const selectedOption = options.find(o => o.value === value)

  return (
    <div className="relative flex items-center" ref={dropdownRef}>
      {/* Dropdown button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1 bg-gray-900 border border-gray-700 text-xs
          focus:outline-none focus:border-blue-500 hover:border-gray-600
          transition-colors flex items-center gap-2 min-w-[130px] justify-between cursor-pointer
          ${isFiltered ? 'rounded-l-lg border-r-0' : 'rounded-lg'}`}
      >
        <span className={`flex items-center gap-2 ${isFiltered ? 'text-white' : 'text-gray-500'}`}>
          {isFiltered ? (
            <>
              <Filter className="w-3 h-3 text-blue-400 fill-blue-400" />
              {selectedOption?.icon}
              {selectedOption?.label}
            </>
          ) : (
            <>
              <Filter className="w-3 h-3" />
              {placeholder}
            </>
          )}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Clear button - only when filtered */}
      {isFiltered && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onChange('all' as T)
          }}
          className="flex items-center justify-center w-[22px] h-[26px]
            bg-gray-900 border border-gray-700 rounded-r-lg
            text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/50
            transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
          {/* All option */}
          <button
            type="button"
            onClick={() => {
              onChange('all' as T)
              setIsOpen(false)
            }}
            className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-700
              transition-colors flex items-center justify-between cursor-pointer
              ${value === 'all' ? 'bg-gray-700/50' : ''}`}
          >
            <span className="text-white">{allLabel || `All ${placeholder}s`}</span>
            {value === 'all' && <Check className="w-3.5 h-3.5 text-blue-400" />}
          </button>

          {/* Options */}
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-700
                transition-colors flex items-center justify-between cursor-pointer
                ${value === option.value ? 'bg-gray-700/50' : ''}`}
            >
              <span className="flex items-center gap-2 text-white">
                {option.icon}
                {option.label}
              </span>
              {value === option.value && <Check className="w-3.5 h-3.5 text-blue-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## FilterDropdown with Search

For large option sets (10+ items) with search capability.

```tsx
interface SearchableFilterProps {
  value: string
  options: string[]
  onChange: (value: string) => void
  placeholder: string
  searchPlaceholder?: string
  allLabel?: string
}

function SearchableFilter({
  value,
  options,
  onChange,
  placeholder,
  searchPlaceholder,
  allLabel,
}: SearchableFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options
    return options.filter((opt) => opt.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [options, searchQuery])

  const isFiltered = value !== 'all'

  return (
    <div className="relative flex items-center" ref={dropdownRef}>
      {/* Dropdown button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1 bg-gray-900 border border-gray-700 text-xs
          focus:outline-none focus:border-blue-500 hover:border-gray-600
          transition-colors flex items-center gap-2 min-w-[130px] justify-between cursor-pointer
          ${isFiltered ? 'rounded-l-lg border-r-0' : 'rounded-lg'}`}
      >
        <span className={`flex items-center gap-2 ${isFiltered ? 'text-white' : 'text-gray-500'}`}>
          {isFiltered ? (
            <>
              <Filter className="w-3 h-3 text-blue-400 fill-blue-400" />
              <span className="truncate max-w-[100px]">{value}</span>
            </>
          ) : (
            <>
              <Filter className="w-3 h-3" />
              {placeholder}
            </>
          )}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Clear button */}
      {isFiltered && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onChange('all')
          }}
          className="flex items-center justify-center w-[22px] h-[26px]
            bg-gray-900 border border-gray-700 rounded-r-lg
            text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/50
            transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* Dropdown menu with search */}
      {isOpen && (
        <div className="absolute top-full z-10 mt-1 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
              <input
                ref={searchInputRef}
                type="search"
                placeholder={searchPlaceholder || `Search ${placeholder.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
                className="w-full pl-7 pr-2 py-1 bg-gray-900 border border-gray-700 rounded
                  text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Scrollable options list */}
          <div className="max-h-[390px] overflow-y-auto">
            {/* All option - hide if searching and no match */}
            {(!searchQuery || allLabel?.toLowerCase().includes(searchQuery.toLowerCase())) && (
              <button
                type="button"
                onClick={() => {
                  onChange('all')
                  setIsOpen(false)
                  setSearchQuery('')
                }}
                className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-700
                  transition-colors flex items-center justify-between cursor-pointer
                  ${value === 'all' ? 'bg-gray-700/50' : ''}`}
              >
                <span className="text-white">{allLabel || `All ${placeholder}s`}</span>
                {value === 'all' && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
            )}

            {/* Filtered options */}
            {filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option)
                  setIsOpen(false)
                  setSearchQuery('')
                }}
                className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-700
                  transition-colors flex items-center justify-between cursor-pointer
                  ${value === option ? 'bg-gray-700/50' : ''}`}
              >
                <span className="text-white truncate">{option}</span>
                {value === option && <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
              </button>
            ))}

            {/* No results */}
            {filteredOptions.length === 0 && searchQuery && (
              <div className="px-3 py-2 text-xs text-gray-500 text-center">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## Filter State Management

Standard pattern for managing filter state with React hooks.

```tsx
// Filter state declarations
const [searchQuery, setSearchQuery] = useState('')
const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all')
const [repoFilter, setRepoFilter] = useState<string>('all')
const [authorFilter, setAuthorFilter] = useState<string>('all')

// Derive available options from data
const availablePlatforms = useMemo(() => {
  const platforms = new Set(items.map(item => item.platform))
  return Array.from(platforms)
}, [items])

const availableRepos = useMemo(() => {
  const repos = new Set(items.map(item => item.repository))
  return Array.from(repos).sort()
}, [items])

const availableAuthors = useMemo(() => {
  const authors = new Set(items.map(item => item.author))
  return Array.from(authors).sort()
}, [items])

// Check if any filters are active
const hasActiveFilters = useMemo(() => {
  return (
    searchQuery !== '' ||
    statusFilter !== 'all' ||
    platformFilter !== 'all' ||
    repoFilter !== 'all' ||
    authorFilter !== 'all'
  )
}, [searchQuery, statusFilter, platformFilter, repoFilter, authorFilter])

// Reset all filters
const resetAllFilters = () => {
  setSearchQuery('')
  setStatusFilter('all')
  setPlatformFilter('all')
  setRepoFilter('all')
  setAuthorFilter('all')
}
```

---

## Filter Logic

Apply filters using `useMemo` to prevent recalculation.

```tsx
const filteredItems = useMemo(() => {
  return items.filter((item) => {
    // Text search - match against multiple fields
    const matchesSearch =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.repository.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase())

    // Status filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter

    // Platform filter
    const matchesPlatform = platformFilter === 'all' || item.platform === platformFilter

    // Repository filter
    const matchesRepo = repoFilter === 'all' || item.repository === repoFilter

    // Author filter
    const matchesAuthor = authorFilter === 'all' || item.author === authorFilter

    return matchesSearch && matchesStatus && matchesPlatform && matchesRepo && matchesAuthor
  })
}, [items, searchQuery, statusFilter, platformFilter, repoFilter, authorFilter])

// Reset pagination when filters change
useEffect(() => {
  setCurrentPage(1)
}, [searchQuery, statusFilter, platformFilter, repoFilter, authorFilter])
```

---

## Click Outside Detection

Reusable hook for closing dropdowns on outside click.

```tsx
function useClickOutside(ref: RefObject<HTMLElement>, callback: () => void) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [ref, callback])
}

// Usage
const dropdownRef = useRef<HTMLDivElement>(null)
useClickOutside(dropdownRef, () => {
  setIsOpen(false)
  setSearchQuery('')
})
```

---

## Clear Button Pattern

Connected clear button that appears when filter is active.

```tsx
{/* Button changes shape when filtered */}
<button
  className={`px-3 py-1 bg-gray-900 border border-gray-700 text-xs ...
    ${isFiltered ? 'rounded-l-lg border-r-0' : 'rounded-lg'}`}
>
  {/* Content */}
</button>

{/* Clear button - only renders when filtered */}
{isFiltered && (
  <Tooltip title="Clear Filter" description={`Reset ${label} to All`} position="top">
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()  // Prevent dropdown from opening
        onChange('all')
      }}
      className="flex items-center justify-center w-[22px] h-[26px]
        bg-gray-900 border border-gray-700 rounded-r-lg
        text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/50
        transition-colors cursor-pointer"
    >
      <X className="w-3 h-3" />
    </button>
  </Tooltip>
)}
```

### Visual States

| State | Button Style | Clear Button |
|-------|--------------|--------------|
| Unfiltered | `rounded-lg`, gray text | Hidden |
| Filtered | `rounded-l-lg border-r-0`, white text, blue filter icon | Visible, `rounded-r-lg` |
| Hovering clear | - | Red text/border/background |

---

## Conditional Rendering

Only show filter dropdowns when they have multiple options.

```tsx
{/* Only show platform filter if multiple platforms exist */}
{availablePlatforms.length > 1 && (
  <PlatformSelect
    value={platformFilter}
    platforms={availablePlatforms}
    onChange={setPlatformFilter}
  />
)}

{/* Only show reset button when filters are active */}
{hasActiveFilters && (
  <IconButton
    icon={X}
    variant="danger"
    size="sm"
    tooltip="Clear all filters"
    onClick={resetAllFilters}
  />
)}
```

---

## Filter from List Items

Allow clicking elements in list items to apply filters.

```tsx
interface ItemProps {
  item: Item
  onFilterByPlatform: (platform: string) => void
  onFilterByRepo: (repo: string) => void
  onFilterByAuthor: (author: string) => void
}

function ListItem({ item, onFilterByPlatform, onFilterByRepo, onFilterByAuthor }: ItemProps) {
  return (
    <div className="p-3 rounded-lg border border-gray-700 bg-gray-800/50">
      <div className="flex items-center gap-2">
        {/* Clickable platform icon */}
        <Tooltip title="GitHub" description="Filter by GitHub">
          <button
            onClick={() => onFilterByPlatform(item.platform)}
            className="hover:opacity-80 transition-opacity"
          >
            <PlatformIcon platform={item.platform} className="w-4 h-4" />
          </button>
        </Tooltip>

        {/* Clickable repository label */}
        <Label
          color="gray"
          size="sm"
          onClick={() => onFilterByRepo(item.repository)}
          tooltip={{ title: item.repository, description: 'Click to filter' }}
        >
          {item.repository}
        </Label>
      </div>
    </div>
  )
}
```
