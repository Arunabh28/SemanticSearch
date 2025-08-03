import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import IngestComponent from './ingest-component';
import SearchComponent from './search-component';

// Ingest component


const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

function Ingest() {
  return <IngestComponent apiBaseUrl={API_BASE_URL} />;
}

function Search() {
  return <SearchComponent apiBaseUrl={API_BASE_URL} />;
}

function App() {
  return (
    <Router>
      <nav style={{ padding: 16, background: '#222' }}>
        <Link to="/ingest" style={{ color: '#fff', marginRight: 16 }}>Ingest</Link>
        <Link to="/search" style={{ color: '#fff' }}>Search</Link>
      </nav>
      <Routes>
        <Route path="/ingest" element={<Ingest />} />
        <Route path="/search" element={<Search />} />
        <Route path="*" element={<Search />} />
      </Routes>
    </Router>
  );
}

export default App;
