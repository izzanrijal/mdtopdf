import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const generateSinglePagePDF = async (elementId: string, filename: string): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Element not found');

  // Capture the element as a canvas
  const canvas = await html2canvas(element, {
    scale: 2, // Higher scale for better resolution
    useCORS: true, // Handle cross-origin images if possible
    logging: false,
    backgroundColor: '#ffffff'
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  
  // A4 Dimensions in mm
  const pdfWidth = 210;
  const pdfHeight = 297;
  
  // Initialize jsPDF with named import
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const imgProps = doc.getImageProperties(imgData);
  const contentWidth = imgProps.width;
  const contentHeight = imgProps.height;

  // Calculate ratio
  const widthRatio = pdfWidth / contentWidth;
  const heightRatio = pdfHeight / contentHeight;

  // To fit on ONE page, we must take the smaller of the two ratios
  // This ensures both width and height fit within A4 limits
  const scaleFactor = Math.min(widthRatio, heightRatio);

  const finalWidth = contentWidth * scaleFactor;
  const finalHeight = contentHeight * scaleFactor;

  // Center vertically if it's very short, otherwise top align
  const x = (pdfWidth - finalWidth) / 2;
  const y = 0; // Top align to maximize space use

  doc.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);
  doc.save(`${filename}.pdf`);
};