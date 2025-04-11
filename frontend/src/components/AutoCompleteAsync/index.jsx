import { useState, useEffect, useRef } from 'react';

import { request } from '@/request';
import useOnFetch from '@/hooks/useOnFetch';
import useDebounce from '@/hooks/useDebounce';
import { useNavigate } from 'react-router-dom';

import { Select, Empty } from 'antd';
import useLanguage from '@/locale/useLanguage';

export default function AutoCompleteAsync({
  entity,
  displayLabels,
  searchFields,
  outputValue = '_id',
  redirectLabel = 'Add New',
  withRedirect = false,
  urlToRedirect = '/',
  value, /// this is for update
  onChange, /// this is for update
}) {
  const translate = useLanguage();
  const addNewValue = { value: 'redirectURL', label: `+ ${translate(redirectLabel)}` };
  
  // Maintain refs to prevent infinite updates
  const initialMountDone = useRef(false);
  const isSearching = useRef(false);
  const ignoreNextValueChange = useRef(false);
  
  // Component state
  const [selectOptions, setOptions] = useState([]);
  const [currentValue, setCurrentValue] = useState(undefined);
  const [searching, setSearching] = useState(false);
  const [valToSearch, setValToSearch] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  
  const navigate = useNavigate();

  // Process API search results
  const asyncSearch = async (options) => {
    return await request.search({ entity, options });
  };

  let { onFetch, result, isSuccess, isLoading } = useOnFetch();
  
  // Format labels for display
  const labels = (optionField) => {
    return displayLabels.map((x) => optionField[x]).join(' ');
  };

  // Handle selection change - called by the Select component
  const handleSelectChange = (newValue) => {
    // Avoid triggering the value useEffect
    ignoreNextValueChange.current = true;
    
    // Handle redirection
    if (newValue === 'redirectURL' && withRedirect) {
      navigate(urlToRedirect);
      return;
    }
    
    // Process the value - extract the outputValue if it exists
    const processedValue = newValue ? 
      (typeof newValue === 'object' && newValue !== null && outputValue in newValue ? 
        newValue[outputValue] : newValue) : 
      undefined;
    
    // Update local state
    setCurrentValue(processedValue);
    
    // Propagate change to parent component
    if (onChange && newValue) {
      onChange(processedValue);
    }
  };

  // Set up debounce for search
  const [, cancel] = useDebounce(
    () => {
      setDebouncedValue(valToSearch);
    },
    500,
    [valToSearch]
  );

  // Fetch search results when debounced value changes
  useEffect(() => {
    if (debouncedValue) {
      const options = {
        q: debouncedValue,
        fields: searchFields,
      };
      const callback = asyncSearch(options);
      onFetch(callback);
    }
    return () => {
      cancel();
    };
  }, [debouncedValue]);

  // Handle search input change
  const onSearch = (searchText) => {
    if (searchText) {
      isSearching.current = true;
      setSearching(true);
      setValToSearch(searchText);
    }
  };
  
  // Update options when search results change
  useEffect(() => {
    if (isSuccess && isSearching.current) {
      setOptions(result || []);
      isSearching.current = false;
    } else if (!isSuccess && isSearching.current) {
      setSearching(false);
    }
  }, [isSuccess, result]);
    // Handle initial value and value prop changes
  useEffect(() => {
    // Skip if we're handling an internal state change
    if (ignoreNextValueChange.current) {
      ignoreNextValueChange.current = false;
      return;
    }
    
    // Only process value if it's defined and different from current value
    if (value !== undefined) {
      // Extract actual value to use (handling nested objects)
      const valueToUse = value && typeof value === 'object' && outputValue in value 
        ? value[outputValue] 
        : value;
      
      // Update value only if it's actually changing
      if (valueToUse !== currentValue) {
        setCurrentValue(valueToUse);
        
        // Only update options on initial mount
        if (!initialMountDone.current) {
          if (typeof value === 'object') {
            setOptions([value]);
          }
          initialMountDone.current = true;
        }
      }
    }
  }, [value, outputValue, currentValue]);
  return (
    <Select
      loading={isLoading}
      showSearch
      allowClear
      placeholder={translate('Search')}
      defaultActiveFirstOption={false}
      filterOption={false}
      notFoundContent={searching ? '... Searching' : <Empty />}
      value={currentValue}
      onSearch={onSearch}
      onClear={() => {
        setSearching(false);
      }}
      onChange={handleSelectChange}
      style={{ minWidth: '220px' }}
    >
      {selectOptions.map((optionField) => {
        // Handle both object values and primitives
        const optionValue = typeof optionField === 'object' && optionField !== null
          ? (optionField[outputValue] || optionField)
          : optionField;
        
        // Generate a stable key
        const optionKey = typeof optionValue === 'string' || typeof optionValue === 'number'
          ? optionValue
          : JSON.stringify(optionValue);
          
        return (
          <Select.Option
            key={optionKey}
            value={optionValue}
          >
            {typeof optionField === 'object' && optionField !== null 
              ? labels(optionField)
              : String(optionField)}
          </Select.Option>
        );
      })}
      {withRedirect && (
        <Select.Option value={addNewValue.value}>
          {addNewValue.label}
        </Select.Option>
      )}
    </Select>
  );
}
