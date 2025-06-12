import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table, TableBody, TableCell, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent, TextField
} from '@mui/material';

export default function PickupConfirmationPage() {
  const [orders, setOrders] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [returnQuantities, setReturnQuantities] = useState({});
  const [photoFile, setPhotoFile] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/pickup/for-pickup');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  const handleOpenDialog = (order) => {
    setSelectedOrder(order);
    const initialReturnQty = {};
    order.items.forEach(item => {
      initialReturnQty[item.name] = '';
    });
    setReturnQuantities(initialReturnQty);
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setSelectedOrder(null);
    setPhotoFile(null);
  };

  const handleReturnQtyChange = (itemName, value) => {
    setReturnQuantities(prev => ({
      ...prev,
      [itemName]: value,
    }));
  };

  const handleConfirmPickup = async () => {
    if (!selectedOrder) return;

    const formData = new FormData();
    formData.append('orderId', selectedOrder.id);
    formData.append('clientName', selectedOrder.clientName);
    formData.append('address', selectedOrder.address);
    formData.append(
      'items',
      JSON.stringify(
        selectedOrder.items.map(item => ({
          name: item.name,
          deliveredQty: item.deliveredQty,
          price: item.price,
          returnQty: Number(returnQuantities[item.name] || 0),
        }))
      )
    );

    if (photoFile) {
      formData.append('photo', photoFile);
    }

    try {
      await axios.post('http://localhost:5000/api/pickup/confirm', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Pickup confirmed successfully.');
      handleCloseDialog();
      fetchOrders(); // refresh list
    } catch (err) {
      console.error('Pickup confirmation failed:', err);
      alert('Pickup confirmation failed.');
    }
  };

  return (
    <>
      <h2>Pickup Confirmation</h2>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Order ID</TableCell>
            <TableCell>Client Name</TableCell>
            <TableCell>Address</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>{order.id}</TableCell>
              <TableCell>{order.clientName}</TableCell>
              <TableCell>{order.address}</TableCell>
              <TableCell>
                <Button variant="outlined" onClick={() => handleOpenDialog(order)}>
                  View More
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Delivered Items - {selectedOrder?.id}</DialogTitle>
        <DialogContent dividers>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>Delivered Quantity</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Return Quantity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedOrder?.items.map((item) => (
                <TableRow key={item.name}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.deliveredQty}</TableCell>
                  <TableCell>₹{item.price}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      variant="outlined"
                      size="small"
                      placeholder="Return Qty"
                      value={returnQuantities[item.name] || ''}
                      onChange={(e) => handleReturnQtyChange(item.name, e.target.value)}
                      inputProps={{ min: 0, max: item.deliveredQty }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div style={{ marginTop: 20 }}>
            <label htmlFor="upload-photo">
              <input
                type="file"
                accept="image/*"
                id="upload-photo"
                style={{ display: 'none' }}
                onChange={(e) => setPhotoFile(e.target.files[0])}
              />
              <Button variant="outlined" component="span">
                Upload Pickup Photo
              </Button>
              {photoFile && <span style={{ marginLeft: 10 }}>{photoFile.name}</span>}
            </label>
          </div>

          <div style={{ marginTop: 20, textAlign: 'right' }}>
            <Button variant="contained" color="primary" onClick={handleConfirmPickup}>
              Confirm Pickup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
