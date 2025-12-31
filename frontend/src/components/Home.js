import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const Home = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newItem, setNewItem] = useState({ title: '', description: '', value: '' });
  const [editingItem, setEditingItem] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.getData();
      setData(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async () => {
    if (!newItem.title.trim()) return;
    
    try {
      setLoading(true);
      await apiService.createData(newItem);
      setNewItem({ title: '', description: '', value: '' });
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItem = async (id, updatedData) => {
    try {
      setLoading(true);
      await apiService.updateData(id, updatedData);
      setEditingItem(null);
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      setLoading(true);
      await apiService.deleteData(id);
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="container">
      <h2>Welcome to Flight Group Alpha</h2>
      
      <div className="card">
        <h3>Flight Management Dashboard</h3>
        <p>Manage your flight data locally. All data is stored in your browser's local storage.</p>
        
        {/* Add new item form */}
        <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '4px' }}>
          <h4>Add New Flight Route</h4>
          <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr 1fr auto' }}>
            <input
              type="text"
              placeholder="Title"
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <input
              type="text"
              placeholder="Description"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <input
              type="text"
              placeholder="Status"
              value={newItem.value}
              onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <button className="button" onClick={handleCreateItem} disabled={loading || !newItem.title.trim()}>
              Add
            </button>
          </div>
        </div>
        
        <button className="button" onClick={fetchData} disabled={loading} style={{ marginBottom: '20px' }}>
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
        
        {error && (
          <div style={{ color: 'red', marginBottom: '20px', padding: '10px', background: '#fff5f5', borderRadius: '4px' }}>
            Error: {error}
          </div>
        )}
        
        {data && data.length > 0 ? (
          <div>
            <h4>Flight Routes ({data.length} total)</h4>
            <div style={{ display: 'grid', gap: '15px' }}>
              {data.map((item) => (
                <div key={item.id} style={{ 
                  padding: '15px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  background: 'white'
                }}>
                  {editingItem === item.id ? (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const updated = data.map(d => d.id === item.id ? { ...d, title: e.target.value } : d);
                          setData(updated);
                        }}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                      />
                      <input
                        type="text"
                        value={item.description || ''}
                        onChange={(e) => {
                          const updated = data.map(d => d.id === item.id ? { ...d, description: e.target.value } : d);
                          setData(updated);
                        }}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                      />
                      <input
                        type="text"
                        value={item.value || ''}
                        onChange={(e) => {
                          const updated = data.map(d => d.id === item.id ? { ...d, value: e.target.value } : d);
                          setData(updated);
                        }}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                      />
                      <div>
                        <button 
                          className="button" 
                          onClick={() => handleUpdateItem(item.id, item)}
                          style={{ marginRight: '10px' }}
                        >
                          Save
                        </button>
                        <button 
                          className="button" 
                          onClick={() => setEditingItem(null)}
                          style={{ background: '#6c757d' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h5 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{item.title}</h5>
                      <p style={{ margin: '0 0 10px 0', color: '#666' }}>{item.description}</p>
                      <p style={{ margin: '0 0 10px 0' }}><strong>Status:</strong> {item.value}</p>
                      <small style={{ color: '#888' }}>
                        Created: {new Date(item.createdAt).toLocaleDateString()}
                        {item.updatedAt && ` • Updated: ${new Date(item.updatedAt).toLocaleDateString()}`}
                      </small>
                      <div style={{ marginTop: '10px' }}>
                        <button 
                          className="button" 
                          onClick={() => setEditingItem(item.id)}
                          style={{ marginRight: '10px', fontSize: '12px', padding: '6px 12px' }}
                        >
                          Edit
                        </button>
                        <button 
                          className="button" 
                          onClick={() => handleDeleteItem(item.id)}
                          style={{ background: '#dc3545', fontSize: '12px', padding: '6px 12px' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>No flight routes found. Add your first route above!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;