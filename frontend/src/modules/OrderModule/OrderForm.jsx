import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { message } from 'antd';
import request from '../../services/request';

const OrderForm = () => {
  const { current: currentUser } = useSelector((state) => state.auth);
  
  const handleSubmit = async (values) => {
    try {
      const orderData = {
        ...values,
        orderType: 'doctor',
        doctorId: currentUser._id,
        doctorName: currentUser.name,
        hospitalName: currentUser.hospitalName, // Assuming this is stored in user data
        createdBy: currentUser._id
      };

      const response = await request.create({
        entity: 'orders',
        jsonData: orderData
      });

      if (response.success) {
        message.success('Order created successfully');
        // ... rest of success handling
      }
    } catch (error) {
      console.error('Error creating order:', error);
      message.error('Failed to create order');
    }
  };

  // ... rest of the component
};

export default OrderForm; 