// pages/api/locations.js
import axios from 'axios';

export default async (req, res) => {
  try {
    // Add authentication headers if required
    

    const response = await axios.get('http://localhost:30080/api/locations?populate=photo');
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching data:', error);
    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data.message });
    } else {
      res.status(500).json({ error: 'Error fetching data' });
    }
  }
};