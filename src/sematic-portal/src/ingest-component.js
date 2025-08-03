import React, { Component } from 'react';

class IngestComponent extends Component {
  render() {
   // Placeholder for ingest UI
  return (
    <div style={{ padding: 24 }}>
      <h2>Ingest</h2>
      <p>Upload text, PDF, or image files to ingest into the semantic search system.</p>
      {/* TODO: Implement file upload UI */}
      <input type="file" />
      <button disabled>Upload (Coming Soon)</button>
    </div>
  );

  }
}

export default IngestComponent; // Don’t forget to use export default!