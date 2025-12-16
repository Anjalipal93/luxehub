import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Grid, MenuItem, Avatar } from '@mui/material';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'https://luxehub-7.onrender.com/api';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', gender: 'prefer_not_to_say' });
  const [preview, setPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setProfile(res.data);
      setForm({
        name: res.data.name || '',
        phone: res.data.phone || '',
        gender: res.data.gender || 'prefer_not_to_say',
      });
      setPreview(res.data.avatar ? `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'https://luxehub-7.onrender.com'}${res.data.avatar}` : null);
    } catch (e) {
      console.error('Fetch profile error', e);
      const msg = e.response?.status === 401 ? 'Please login to view your profile' : (e.response?.data?.message || 'Failed to load profile');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('phone', form.phone);
      fd.append('gender', form.gender);
      if (avatarFile) {
        fd.append('avatar', avatarFile);
      }
      const res = await axios.put(`${API_URL}/users/me`, fd, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setProfile(res.data);
      setPreview(res.data.avatar ? `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'https://luxehub-7.onrender.com'}${res.data.avatar}` : preview);
      toast.success('Profile updated');
    } catch (e) {
      console.error('Save profile error', e);
      let msg = e.response?.status === 401 ? 'Please login again' : (e.response?.data?.message || 'Failed to update profile');
      if (e.message?.includes('payload') || e.message?.includes('FormData')) {
        msg = 'Failed to upload. Please try a smaller image (max 3MB).';
      }
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Box sx={{ p: 3 }}>Loading...</Box>;
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        🙍 Profile
      </Typography>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        {error && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="error" sx={{ mb: 1 }}>
              {error}
            </Typography>
            <Button variant="outlined" onClick={fetchProfile}>Retry</Button>
          </Box>
        )}
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={preview || undefined}
                sx={{ width: 120, height: 120, fontSize: 48 }}
              >
                {profile?.name?.[0] || 'U'}
              </Avatar>
              <Button variant="outlined" component="label">
                Change Picture
                <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={9}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Email" value={profile?.email || ''} disabled />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Gender"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                  <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
                </TextField>
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button variant="contained" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outlined" onClick={fetchProfile} disabled={saving}>
                Refresh
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}


