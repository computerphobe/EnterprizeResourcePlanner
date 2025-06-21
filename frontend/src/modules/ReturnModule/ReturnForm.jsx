import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { message } from 'antd';
import { request } from '../../services/request';

const ReturnForm = () => {
  const { current: currentUser } = useSelector((state) => state.auth);
  
  const handleSubmit = async (values) => {
    try {
      const returnData = {
        ...values,
        returnType: 'doctor',
        doctorId: currentUser._id,
        doctorName: currentUser.name,
        hospitalName: currentUser.hospitalName,
        createdBy: currentUser._id
      };

      const response = await request.create({
        entity: 'returns',
        jsonData: returnData
      });

      if (response.success) {
        message.success('Return created successfully');
        // ... rest of success handling
      }
    } catch (error) {
      console.error('Error creating return:', error);
      message.error('Failed to create return');
    }
  };

  // ... rest of the component
};

export default ReturnForm; 