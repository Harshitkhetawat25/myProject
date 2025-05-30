const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generatePDF = async (booking) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const buffers = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });
        
        // Add content to the PDF
        doc.fontSize(25).text('Booking Invoice', { align: 'center' });
        doc.moveDown();
        
        doc.fontSize(14).text(`Booking ID: ${booking._id}`);
        doc.text(`Date: ${new Date(booking.bookingDate).toLocaleDateString()}`);
        doc.moveDown();
        
        doc.text(`Property: ${booking.listing.title}`);
        doc.text(`Location: ${booking.listing.location}, ${booking.listing.country}`);
        doc.moveDown();
        
        doc.text(`Check-in: ${new Date(booking.checkIn).toLocaleDateString()}`);
        doc.text(`Check-out: ${new Date(booking.checkOut).toLocaleDateString()}`);
        doc.text(`Guests: ${booking.guests}`);
        doc.moveDown();
        
        doc.fontSize(16).text(`Total Price: ₹${booking.totalPrice.toLocaleString('en-IN')}`, { align: 'right' });
        doc.moveDown();
        
        doc.text('Thank you for your booking!', { align: 'center' });
        
        doc.end();
    });
};

module.exports = { generatePDF };