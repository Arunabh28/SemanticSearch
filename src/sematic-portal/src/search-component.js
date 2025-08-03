import React from 'react';

function SearchComponent() {
  const [query, setQuery] = React.useState('');
  const [suggestions, setSuggestions] = React.useState([]);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);


  // Configurable API base URL
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

  // Fetch autocomplete suggestions
  React.useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().split(/\s+/).length > 3) {
        const res = await fetch(`${API_BASE_URL}/autocomplete?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setShowDropdown(true);
        }
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    };
    fetchSuggestions();
  }, [query, API_BASE_URL]);

  const handleSearch = async () => {
    setLoading(true);
    setShowDropdown(false);
    const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      setResults(data);
    } else {
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Semantic Search</h2>
      <div style={{ position: 'relative', maxWidth: 500 }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Type your search query..."
          style={{ width: '100%', padding: 8, fontSize: 16 }}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        />
        {showDropdown && suggestions.length > 0 && (
          <ul style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 36,
            background: '#fff',
            border: '1px solid #ccc',
            zIndex: 10,
            listStyle: 'none',
            margin: 0,
            padding: 0,
            maxHeight: 150,
            overflowY: 'auto',
          }}>
            {suggestions.map((s, i) => (
              <li
                key={i}
                style={{ padding: 8, cursor: 'pointer' }}
                onMouseDown={() => {
                  setQuery(s);
                  setShowDropdown(false);
                }}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button onClick={handleSearch} style={{ marginTop: 12, padding: '8px 16px', fontSize: 16 }}>
        Search
      </button>
      {loading && <div>Loading...</div>}
      <div style={{ marginTop: 24 }}>
        {results.length > 0 && (
          <>
            <h3>Results</h3>
            <ul>
              {results.map((r, i) => (
                <li key={i} style={{ marginBottom: 16 }}>
                  <div><b>Preview:</b> {r.preview}</div>
                  <div><b>Score:</b> {r.score}</div>
                  <div><b>Text:</b> <pre style={{ whiteSpace: 'pre-wrap' }}>{r.text}</pre></div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

export default SearchComponent;
