import React from 'react'
import { useState } from 'react';
import axios from 'axios';

const UploadFileToS3 = () => {

  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload.');
      return;
    }

    const preSignedUrl =
      'https://demotestproducts.s3.ap-south-1.amazonaws.com/question-docs/?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIATBK6BGIEQ25S26VC%2F20230926%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20230926T063251Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=f5ce6508e508e1a9c70c99313d9b9cc1c4f0bd0abe3954c9e1aed86f05e6fe51';

    try {
      const response = await axios.put(preSignedUrl, selectedFile, {
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      if (response.status === 200) {
        alert('File uploaded successfully!');
      } else {
        alert('File upload failed.');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  return (
    <div>
      <h1>File Upload to S3 Bucket</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload File</button>
    </div>
  );
}

export default UploadFileToS3