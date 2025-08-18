const PDFService = require('./pdfService');

(async () => {
  const pdfService = new PDFService();
  
  // Sample transaction data
  const transactionData = {
    id: '123456',
    created_at: '2023-10-05T10:00:00Z',
    customer: {
      name: 'John Doe',
      phone: '9876543210'
    },
    items: [
      { product_name: 'Gold Necklace', quantity: 1, price: 25000 },
      { product_name: 'Diamond Ring', quantity: 2, price: 15000 }
    ],
    total_amount: 55000
  };

  // Sample company settings
  const companySettings = {
    company_name: 'My Jewellery Store',
    company_address: '123 Gem Street, Diamond City',
    company_phone: '01234 567890',
    company_email: 'contact@myjewellerystore.com'
  };

  try {
    const pdfBuffer = await pdfService.generateInvoicePDF(transactionData, companySettings);
    
    // Do something with the PDF buffer, like saving to a file or sending in a response
    const fs = require('fs');
    fs.writeFileSync('invoice.pdf', pdfBuffer);
    console.log('Invoice PDF generated successfully!');
  } catch (error) {
    console.error('Failed to generate PDF:', error);
  }
})();