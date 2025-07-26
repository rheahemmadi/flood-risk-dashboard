'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getAutocompleteSuggestions, SearchSuggestion } from '@/lib/utils/search';

interface MapSearchProps {
  onLocationSelect: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  className?: string;
  initialValue?: string;
  onSearchChange?: (query: string) => void;
}

const MapSearch = ({ onLocationSelect, placeholder = "Search locations worldwide...", className = "", initialValue = "", onSearchChange }: MapSearchProps) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const justSelectedRef = useRef(false);

  // Sync with external search query
  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  // Simple search effect
  useEffect(() => {
    // Don't search if we just selected a suggestion
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await getAutocompleteSuggestions(query);
        setSuggestions(results);
        setShowDropdown(true);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    justSelectedRef.current = true;
    onLocationSelect(suggestion);
    setQuery(suggestion.place_name);
    onSearchChange?.(suggestion.place_name);
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearchChange?.(value);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleInputBlur = () => {
    // Small delay to allow clicking on suggestions
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  const clearSearch = () => {
    setQuery('');
    onSearchChange?.('');
    setSuggestions([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="pl-10 pr-10 bg-white/95 backdrop-blur-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Simple dropdown */}
      {showDropdown && (suggestions.length > 0 || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto mb-2"></div>
              Searching...
            </div>
          ) : (
            <div className="py-1">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSuggestionClick(suggestion);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {suggestion.text}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {suggestion.place_name.replace(suggestion.text + ', ', '')}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MapSearch; 