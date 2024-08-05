export default async function handler(req, res) {
    if (req.method === 'POST') {
      const { oldRerumId, newFirebaseId } = req.body;
  
      try {
        const response = await fetch(oldRerumId);
        const oldData = await response.json();
  
        const updatedUser = {
          ...oldData,
          uid: newFirebaseId,
        };
  
        const overwriteResponse = await fetch(`${RERUM_PREFIX}overwrite`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedUser),
        });
  
        if (overwriteResponse.ok) {
          res.status(200).json({ message: 'UID added successfully.' });
        } else {
          res.status(500).json({ message: 'Failed to add UID.' });
        }
      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'An error occurred.' });
      }
    } else {
      res.status(405).json({ message: 'Method Not Allowed' });
    }
  }
  

  