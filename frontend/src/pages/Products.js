import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'https://luxehub-7.onrender.com/api';
const PRESET_CATEGORIES = [
  'Clothes',
  'Electrical',
  'Grocery',
  'Electronics',
  'Furniture',
  'Beauty & Personal Care',
  'Stationery',
  'Sports & Fitness',
  'Automotive',
  'Healthcare',
  'Toys',
  'Other',
];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    brand: '',
    price: '',
    quantity: '',
    minThreshold: '',
    unit: 'piece',
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    // Only fetch products when authentication is ready and user is authenticated
    if (!authLoading && isAuthenticated) {
      fetchProducts();
      fetchCategories();
    }
  }, [authLoading, isAuthenticated]);

  const fetchCategories = async () => {
    try {
      // Ensure token is set in headers
      const token = localStorage.getItem('token');
      const config = token ? {
        headers: {
          Authorization: `Bearer ${token}`
        }
      } : {};
      
      const response = await axios.get(`${API_URL}/products/stats/categories`, config);
      const uniqueCategories = [...new Set(response.data.map(stat => stat._id).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Fetch categories error:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Ensure token is set in headers
      const token = localStorage.getItem('token');
      const config = token ? {
        headers: {
          Authorization: `Bearer ${token}`
        }
      } : {};
      
      const response = await axios.get(`${API_URL}/products`, config);
      setProducts(response.data);
      // Extract unique categories
      const uniqueCategories = [...new Set(response.data.map(p => p.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Fetch products error:', error);
      if (error.response?.status === 401) {
        toast.error('Please login to view your products');
      } else {
        toast.error('Failed to load products');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const handleOpen = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        category: product.category,
        brand: product.brand || '',
        price: product.price,
        quantity: product.quantity,
        minThreshold: product.minThreshold,
        unit: product.unit || 'piece',
      });
      setImagePreview(product.image ? `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'https://luxehub-7.onrender.com'}${product.image}` : null);
      setSelectedImage(null);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        category: '',
        brand: '',
        price: '',
        quantity: '',
        minThreshold: '',
        unit: 'piece',
      });
      setImagePreview(null);
      setSelectedImage(null);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingProduct(null);
    setImagePreview(null);
    setSelectedImage(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();

      // Ensure numeric fields are sent as numbers, not strings
      Object.keys(formData).forEach(key => {
        let value = formData[key];
        if (['price', 'quantity', 'minThreshold'].includes(key)) {
          value = parseFloat(value) || 0;
        }
        formDataToSend.append(key, value);
      });
      
      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }

      // Ensure token is set in headers
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'multipart/form-data',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (editingProduct) {
        await axios.put(`${API_URL}/products/${editingProduct._id}`, formDataToSend, {
          headers,
        });
        toast.success('Product updated successfully');
      } else {
        await axios.post(`${API_URL}/products`, formDataToSend, {
          headers,
        });
        toast.success('Product created successfully');
      }
      fetchProducts();
      handleClose();
    } catch (error) {
      console.error('Save product error:', error);
      toast.error(error.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (productToDelete) {
      try {
        const token = localStorage.getItem('token');
        const config = token ? {
          headers: {
            Authorization: `Bearer ${token}`
          }
        } : {};
        
        await axios.delete(`${API_URL}/products/${productToDelete._id}`, config);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        console.error('Delete product error:', error);
        toast.error('Failed to delete product');
      }
    }
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  // Show loading state while auth is loading or products are being fetched
  if (authLoading || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Show message if not authenticated
  if (!isAuthenticated) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          📦 Products
        </Typography>
        <Alert severity="info">
          Please login to view and manage your products.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          📦 Products
        </Typography>
        {isAuthenticated && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
            sx={{
              background: 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)',
            color: 'var(--text-primary)',
              '&:hover': {
                background: 'linear-gradient(135deg, #38BDF8 0%, #2563EB 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            ➕ Add Product
          </Button>
        )}
      </Box>

      {/* Category Filter */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mr: 1 }}>
          🔍 Filter by Category:
        </Typography>
        <Chip
          label="All Categories"
          onClick={() => setSelectedCategory('all')}
          color={selectedCategory === 'all' ? 'primary' : 'default'}
          sx={{
            cursor: 'pointer',
            background: selectedCategory === 'all' 
              ? 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)'
              : 'default',
            color: selectedCategory === 'all' ? '#F1F5F9' : 'default',
            '&:hover': {
              background: selectedCategory !== 'all' 
                ? 'rgba(56, 189, 248, 0.1)'
                : 'linear-gradient(135deg, #3B82F6 0%, #38BDF8 100%)',
            },
          }}
        />
        {categories.map((category) => (
          <Chip
            key={category}
            label={category}
            onClick={() => setSelectedCategory(category)}
            color={selectedCategory === category ? 'primary' : 'default'}
            sx={{
              cursor: 'pointer',
              background: selectedCategory === category
                ? 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)'
                : 'default',
              color: selectedCategory === category ? '#F1F5F9' : 'default',
              '&:hover': {
                background: selectedCategory !== category
                  ? 'rgba(56, 189, 248, 0.1)'
                  : 'linear-gradient(135deg, #3B82F6 0%, #38BDF8 100%)',
              },
            }}
          />
        ))}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Brand</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product._id}>
                <TableCell>
                  <Box
                    sx={{
                      position: 'relative',
                      width: 60,
                      height: 60,
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      '&:hover .product-image': {
                        transform: 'scale(1.15)',
                      },
                      '&:hover .product-overlay': {
                        opacity: 1,
                      },
                    }}
                  >
                    {product.image ? (
                      <>
                        <img
                          className="product-image"
                          src={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'https://luxehub-7.onrender.com'}${product.image}`}
                          alt={product.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease',
                          }}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/50';
                          }}
                        />
                        <Box
                          className="product-overlay"
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.8) 0%, rgba(56, 189, 248, 0.8) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0,
                            transition: 'opacity 0.3s ease',
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                            color: 'var(--text-primary)',
                              fontWeight: 600,
                              textAlign: 'center',
                              px: 1,
                            }}
                          >
                            {product.name}
                          </Typography>
                        </Box>
                      </>
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          bgcolor: 'grey.200',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                        }}
                      >
                        📦
                      </Box>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{product.brand || '-'}</TableCell>
                <TableCell>${product.price.toFixed(2)}</TableCell>
                <TableCell>{product.quantity}</TableCell>
                <TableCell>
                  {product.lowStockAlert ? (
                    <Chip
                      icon={<WarningIcon />}
                      label="Low Stock"
                      color="error"
                      size="small"
                    />
                  ) : (
                    <Chip label="In Stock" color="success" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  {isAuthenticated && (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => handleOpen(product)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(product)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {products.length === 0 && (
        <Paper sx={{ p: 4, mt: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No products found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Get started by adding your first product
          </Typography>
          {isAuthenticated && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpen()}
            >
              Add Your First Product
            </Button>
          )}
        </Paper>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
          <DialogContent>
            {/* Image Upload Section */}
            <Box sx={{ mb: 2, mt: 2 }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="product-image-upload"
                type="file"
                onChange={handleImageChange}
              />
              <label htmlFor="product-image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  sx={{ 
                    mb: 2,
                    py: 1.5,
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                    },
                  }}
                >
                  📷 {imagePreview ? 'Change Product Image' : 'Upload Product Image'}
                </Button>
              </label>
              {imagePreview && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      borderRadius: '12px',
                      objectFit: 'cover',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Button
                    size="small"
                    color="error"
                    onClick={() => {
                      setImagePreview(null);
                      setSelectedImage(null);
                    }}
                    sx={{ mt: 1 }}
                  >
                    Remove Image
                  </Button>
                </Box>
              )}
            </Box>

            <TextField
              margin="normal"
              required
              fullWidth
              label="Product Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Description"
              name="description"
              multiline
              rows={3}
              value={formData.description}
              onChange={handleChange}
            />
            <Autocomplete
              freeSolo
              options={[...new Set([...(categories || []), ...PRESET_CATEGORIES])]}
              value={formData.category}
              onChange={(_, newValue) => {
                setFormData({ ...formData, category: newValue || '' });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="normal"
                  required
                  fullWidth
                  label="Category"
                  name="category"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  helperText="Choose a category or type a new one"
                />
              )}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Brand"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              type="number"
              label="Price"
              name="price"
              value={formData.price}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              type="number"
              label="Quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              type="number"
              label="Minimum Threshold"
              name="minThreshold"
              value={formData.minThreshold}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              fullWidth
              select
              label="Unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
            >
              <MenuItem value="piece">Piece</MenuItem>
              <MenuItem value="kg">Kilogram</MenuItem>
              <MenuItem value="liter">Liter</MenuItem>
              <MenuItem value="box">Box</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingProduct ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the product "{productToDelete?.name}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

