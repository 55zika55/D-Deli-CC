import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Check, ChevronDown } from 'lucide-react';

export interface AutocompleteOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
  category?: string;
  searchText?: string;
}

interface AutocompleteSelectProps {
  options: AutocompleteOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  emptyMessage?: string;
  required?: boolean;
}

export const AutocompleteSelect: React.FC<AutocompleteSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'ابحث عن صنف أو كود...',
  label,
  disabled = false,
  className = '',
  inputClassName = '',
  autoFocus = false,
  emptyMessage = 'لا توجد نتائج مطابقة',
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Selected option
  const selectedOption = useMemo(() => {
    return options.find(opt => opt.value === value) || null;
  }, [options, value]);

  // Sync display query with selected option when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery(selectedOption ? selectedOption.label : '');
    }
  }, [selectedOption, isOpen]);

  // Filter options based on query
  const filteredOptions = useMemo(() => {
    if (!query || (selectedOption && query === selectedOption.label)) {
      return options;
    }
    const cleanQ = query.trim().toLowerCase();
    return options.filter(opt => {
      const matchLabel = opt.label.toLowerCase().includes(cleanQ);
      const matchVal = opt.value.toLowerCase().includes(cleanQ);
      const matchSub = opt.subLabel ? opt.subLabel.toLowerCase().includes(cleanQ) : false;
      const matchCategory = opt.category ? opt.category.toLowerCase().includes(cleanQ) : false;
      const matchSearch = opt.searchText ? opt.searchText.toLowerCase().includes(cleanQ) : false;
      return matchLabel || matchVal || matchSub || matchCategory || matchSearch;
    });
  }, [options, query, selectedOption]);

  // Reset highlighted index on query change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
        scrollIntoView(highlightedIndex + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
        scrollIntoView(highlightedIndex - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const scrollIntoView = (index: number) => {
    if (listRef.current) {
      const el = listRef.current.children[index] as HTMLElement;
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  };

  const handleSelect = (option: AutocompleteOption) => {
    onChange(option.value);
    setQuery(option.label);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={query}
          onFocus={() => {
            setIsOpen(true);
            // Select text on focus for easier typing
            inputRef.current?.select();
          }}
          onChange={e => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={`w-full pl-8 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition ${
            disabled ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''
          } ${inputClassName}`}
        />

        {/* Search Icon on Right/Left according to RTL */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <Search className="w-3.5 h-3.5" />
        </div>

        {/* Clear & Dropdown Icon */}
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition"
              title="مسح الاختيار"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 text-xs font-sans">
          {filteredOptions.length === 0 ? (
            <div className="p-3 text-center text-slate-400 text-xs">
              {emptyMessage}
            </div>
          ) : (
            <ul ref={listRef} className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={`${opt.value}-${idx}`}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelect(opt)}
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between gap-2 transition ${
                      isHighlighted
                        ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100'
                        : isSelected
                        ? 'bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/40'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-bold ${isSelected ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                          {opt.label}
                        </span>
                        {opt.badge && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.subLabel && (
                        <div className="text-[11px] text-slate-400 dark:text-slate-400 truncate mt-0.5">
                          {opt.subLabel}
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
