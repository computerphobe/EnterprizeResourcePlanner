import { useState, useEffect } from 'react';
import { request } from '@/request';
import useFetch from '@/hooks/useFetch';
import { Select, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { generate as uniqueId } from 'shortid';
import color from '@/utils/color';
import useLanguage from '@/locale/useLanguage';
import { useRef } from 'react';
import { useMemo } from 'react';

const SelectAsync = ({
  entity,
  displayLabels = ['name'],
  outputValue = '_id',
  redirectLabel = '',
  withRedirect = false,
  urlToRedirect = '/',
  placeholder = 'select',
  value,
  onChange,
}) => {
  const translate = useLanguage();
  const [selectOptions, setOptions] = useState([]);
  const [currentValue, setCurrentValue] = useState(undefined);
  
  // Use refs to track state and prevent infinite loops
  const initialMountDone = useRef(false);
  const ignoreNextValueChange = useRef(false);
  
  const navigate = useNavigate();

  // Fetch data from API
  const asyncList = () => {
    return request.list({ entity });
  };
  
  const { result, isLoading: fetchIsLoading, isSuccess } = useFetch(asyncList);
  
  // Update options when data is fetched
  useEffect(() => {
    if (isSuccess && result) {
      setOptions(result);
    }
  }, [isSuccess, result]);

  // Format display labels
  const labels = (optionField) => {
    return displayLabels.map((x) => optionField?.[x] || '').join(' ');
  };
  
  // Handle value prop changes
  useEffect(() => {
    // Skip if handling internal state change
    if (ignoreNextValueChange.current) {
      ignoreNextValueChange.current = false;
      return;
    }
    
    if (value !== undefined) {
      // Extract actual value to use
      const valueToUse = value && typeof value === 'object' && outputValue in value 
        ? value[outputValue] 
        : value;
        
      // Update state if value is changing
      if (valueToUse !== currentValue) {
        setCurrentValue(valueToUse);
        initialMountDone.current = true;
      }
    }
  }, [value, outputValue, currentValue]);

  // Handle selection changes
  const handleSelectChange = (newValue) => {
    // Flag to ignore the next value prop change
    ignoreNextValueChange.current = true;
    
    // Handle redirect
    if (newValue === 'redirectURL') {
      navigate(urlToRedirect);
      return;
    }
    
    // Process selected value
    const processedValue = newValue ? 
      (typeof newValue === 'object' && newValue !== null && outputValue in newValue ? 
        newValue[outputValue] : newValue) : 
      undefined;
    
    // Update local state
    setCurrentValue(processedValue);
    
    // Notify parent component
    if (onChange) {
      onChange(processedValue);
    }
  };
  // Process options for rendering with memoization to avoid unnecessary recalculations
  const optionsList = useMemo(() => {
    const list = [];
    
    if (!selectOptions || !Array.isArray(selectOptions)) {
      return list;
    }
    
    selectOptions.forEach((optionField) => {
      if (!optionField) return;
      
      // Safely extract value
      const value = typeof optionField === 'object' && optionField !== null
        ? (optionField[outputValue] ?? optionField)
        : optionField;
        
      // Get display label
      const label = typeof optionField === 'object' && optionField !== null
        ? labels(optionField)
        : String(optionField);
        
      // Extract color if available
      let optionColor = null;
      if (typeof optionField === 'object' && optionField !== null) {
        const currentColor = 
          (optionField[outputValue] && typeof optionField[outputValue] === 'object' 
            ? optionField[outputValue].color 
            : null) ?? 
          optionField.color;
          
        if (currentColor) {
          const labelColor = color.find(x => x.color === currentColor);
          optionColor = labelColor?.color;
        }
      }
      
      list.push({ 
        value, 
        label, 
        color: optionColor 
      });
    });

    return list;
  }, [selectOptions, outputValue]);

  return (
    <Select
      loading={fetchIsLoading}
      disabled={fetchIsLoading}
      value={currentValue}
      onChange={handleSelectChange}
      placeholder={placeholder}
    >
      {optionsList.map((option) => {
        // Generate a stable key
        const optionKey = typeof option.value === 'string' || typeof option.value === 'number'
          ? option.value
          : JSON.stringify(option.value);
          
        return (
          <Select.Option key={optionKey} value={option.value}>
            <Tag bordered={false} color={option.color}>
              {option.label}
            </Tag>
          </Select.Option>
        );
      })}
      {withRedirect && (
        <Select.Option value="redirectURL">
          {`+ ${translate(redirectLabel)}`}
        </Select.Option>
      )}
    </Select>
  );
};

export default SelectAsync;
