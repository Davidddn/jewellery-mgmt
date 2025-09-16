import React from 'react';

/**
 * Download a QR code SVG as PNG
 * @param {string} svgId - The DOM id of the SVG element
 * @param {string} filename - The filename for download
 */
function downloadSvgAsPng(svgId, filename) {
  const svg = document.getElementById(svgId);
  if (!svg) return;
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg);
  const canvas = document.createElement('canvas');
  const img = new window.Image();
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  img.onload = function () {
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    const pngUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  img.src = url;
}

const ProductQrDownloadButton = ({ svgId, filename }) => (
  <button onClick={() => downloadSvgAsPng(svgId, filename)} style={{ marginTop: 16 }}>
    Download QR Code
  </button>
);

export default ProductQrDownloadButton;
