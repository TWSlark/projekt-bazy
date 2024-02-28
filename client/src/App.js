import React, { useEffect, useState } from 'react';

function App() {

  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/')
      .then(response => response.text())
      .then(data => setData(data))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  return (
    <div>
      <h1>Server Data:</h1>
      <p>{data || 'No data yet'}</p>
    </div>
  );
}

export default App;