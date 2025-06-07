import React, { useRef } from 'react';
import html2pdf from 'html2pdf.js';

function PdfGenerator() {
  // Ref to the content div
  const contentRef = useRef();

  const generatePDF = () => {
    const element = contentRef.current;

    const options = {
      margin: 0.5,
      filename: 'my-document.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    };

    html2pdf().set(options).from(element).save();
  };

  return (
    <div>
      <div ref={contentRef} style={{ padding: '20px', backgroundColor: '#fff' }}>
        <h1>React PDF Content</h1>
        <p>This content will be exported as a PDF.</p>
      </div>

      <button onClick={generatePDF} style={{ marginTop: '20px' }}>
        Download PDF
      </button>
    </div>
  );
}

export default PdfGenerator;
