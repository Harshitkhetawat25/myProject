const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generatePDF = async (booking) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ 
                size: 'A4',
                margin: 50,
                info: {
                    Title: `Invoice - Booking ${booking._id}`,
                    Author: 'StayBooker',
                    Subject: 'Booking Invoice',
                    Keywords: 'booking, invoice, travel, accommodation'
                }
            });
            
            const buffers = [];
            
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });
            doc.on('error', (err) => {
                reject(err);
            });

            // Colors and styling
            const primaryColor = '#667eea';
            const secondaryColor = '#764ba2';
            const darkGray = '#2d3748';
            const lightGray = '#718096';
            const successGreen = '#48bb78';
            
            // Helper functions
            const drawLine = (x1, y1, x2, y2, color = lightGray, width = 1) => {
                doc.strokeColor(color).lineWidth(width).moveTo(x1, y1).lineTo(x2, y2).stroke();
            };
            
            const drawBox = (x, y, width, height, fillColor, strokeColor = null, strokeWidth = 1) => {
                if (fillColor) {
                    doc.fillColor(fillColor).rect(x, y, width, height).fill();
                }
                if (strokeColor) {
                    doc.strokeColor(strokeColor).lineWidth(strokeWidth).rect(x, y, width, height).stroke();
                }
            };

            // Page dimensions - FIXED: Use actual page dimensions
            const pageWidth = doc.page.width - 100; // Account for margins
            const pageHeight = doc.page.height - 100; // Account for margins
            const leftMargin = 50;
            const rightMargin = doc.page.width - 50;
            let currentY = 50;

            // FIXED: Add page boundary check function
            const checkPageSpace = (requiredSpace) => {
                if (currentY + requiredSpace > pageHeight + 50) {
                    doc.addPage();
                    currentY = 50;
                }
            };

            // Header Section with gradient-like effect
            drawBox(leftMargin, currentY, pageWidth, 60, primaryColor); // FIXED: Reduced height
            
            // Company Logo/Name
            doc.fillColor('white')
               .fontSize(24) // FIXED: Reduced font size
               .font('Helvetica-Bold')
               .text('StayBooker', leftMargin + 20, currentY + 18);
            
            // Invoice label
            doc.fontSize(14) // FIXED: Reduced font size
               .font('Helvetica')
               .text('BOOKING INVOICE', rightMargin - 130, currentY + 22, { align: 'right', width: 110 });
            
            currentY += 80;

            // Invoice status badge
            drawBox(rightMargin - 100, currentY, 80, 20, successGreen); // FIXED: Reduced size
            doc.fillColor('white')
               .fontSize(10) // FIXED: Reduced font size
               .font('Helvetica-Bold')
               .text('CONFIRMED', rightMargin - 95, currentY + 5);
            
            currentY += 40;

            // Invoice details and dates
            doc.fillColor(darkGray)
               .fontSize(11) // FIXED: Reduced font size
               .font('Helvetica-Bold');
            
            // Left column - Invoice details
            doc.text('Invoice Details', leftMargin, currentY);
            currentY += 18;
            
            doc.font('Helvetica')
               .fontSize(9) // FIXED: Reduced font size
               .fillColor(lightGray);
            
            const bookingIdShort = booking._id.toString().slice(-8).toUpperCase();
            doc.text(`Invoice Number: INV-${bookingIdShort}`, leftMargin, currentY);
            currentY += 12; // FIXED: Reduced spacing
            doc.text(`Booking ID: ${bookingIdShort}`, leftMargin, currentY);
            currentY += 12;
            doc.text(`Issue Date: ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}`, leftMargin, currentY);
            currentY += 12;
            doc.text(`Booking Date: ${new Date(booking.bookingDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}`, leftMargin, currentY);

            // Right column - Customer info (if available)
            let rightColY = currentY - 48;
            doc.fillColor(darkGray)
               .fontSize(11)
               .font('Helvetica-Bold')
               .text('Bill To', rightMargin - 180, rightColY);
            
            rightColY += 18;
            doc.font('Helvetica')
               .fontSize(9)
               .fillColor(lightGray)
               .text('Guest Name: [Customer Name]', rightMargin - 180, rightColY);
            rightColY += 12;
            doc.text(`Guests: ${booking.guests} ${booking.guests === 1 ? 'person' : 'people'}`, rightMargin - 180, rightColY);

            currentY += 40;
            
            // Check space before next section
            checkPageSpace(100);
            
            // Separator line
            drawLine(leftMargin, currentY, rightMargin, currentY, primaryColor, 2);
            currentY += 25;

            // Property Information Section
            doc.fillColor(darkGray)
               .fontSize(14) // FIXED: Reduced font size
               .font('Helvetica-Bold')
               .text('Property Information', leftMargin, currentY);
            
            currentY += 20;
            
            // Property card background
            drawBox(leftMargin, currentY, pageWidth, 60, '#f7fafc', '#e2e8f0', 1); // FIXED: Reduced height
            
            // Property details
            doc.fillColor(darkGray)
               .fontSize(12) // FIXED: Reduced font size
               .font('Helvetica-Bold')
               .text(booking.listing.title, leftMargin + 15, currentY + 12, { width: pageWidth - 150 });
            
            doc.fillColor(lightGray)
               .fontSize(9) // FIXED: Reduced font size
               .font('Helvetica')
               .text(`📍 ${booking.listing.location}, ${booking.listing.country}`, leftMargin + 15, currentY + 28);
            
            // Price per night
            doc.fillColor(primaryColor)
               .fontSize(12)
               .font('Helvetica-Bold')
               .text(`₹${booking.listing.price.toLocaleString('en-IN')}/night`, rightMargin - 120, currentY + 18, { align: 'right', width: 100 });
            
            currentY += 80;

            // Check space before next section
            checkPageSpace(120);

            // Stay Details Section
            doc.fillColor(darkGray)
               .fontSize(14)
               .font('Helvetica-Bold')
               .text('Stay Details', leftMargin, currentY);
            
            currentY += 20;
            
            // Stay details in a structured format
            const stayDetails = [
                { label: 'Check-in Date', value: new Date(booking.checkIn).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                }) },
                { label: 'Check-out Date', value: new Date(booking.checkOut).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                }) },
                { label: 'Duration', value: `${Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24))} nights` },
                { label: 'Number of Guests', value: `${booking.guests} ${booking.guests === 1 ? 'guest' : 'guests'}` }
            ];

            stayDetails.forEach((detail, index) => {
                const yPos = currentY + (index * 18); // FIXED: Reduced spacing
                doc.fillColor(lightGray)
                   .fontSize(9)
                   .font('Helvetica')
                   .text(detail.label, leftMargin, yPos);
                
                doc.fillColor(darkGray)
                   .fontSize(10)
                   .font('Helvetica-Bold')
                   .text(detail.value, leftMargin + 120, yPos); // FIXED: Reduced spacing
            });
            
            currentY += 90;

            // Check space before payment section
            checkPageSpace(180);

            // Payment Breakdown Section
            doc.fillColor(darkGray)
               .fontSize(14)
               .font('Helvetica-Bold')
               .text('Payment Breakdown', leftMargin, currentY);
            
            currentY += 20;

            // Calculate breakdown
            const nights = Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24));
            const subtotal = booking.listing.price * nights;
            const serviceFee = Math.round(booking.totalPrice * 0.1);
            const taxes = Math.round(booking.totalPrice * 0.05);
            const cleaningFee = Math.round(booking.totalPrice * 0.03);

            // Breakdown table
            const breakdown = [
                { description: `₹${booking.listing.price.toLocaleString('en-IN')} × ${nights} nights`, amount: subtotal },
                { description: 'Service fee', amount: serviceFee },
                { description: 'Cleaning fee', amount: cleaningFee },
                { description: 'Taxes and fees', amount: taxes }
            ];

            // Table header background
            drawBox(leftMargin, currentY, pageWidth, 20, '#f7fafc'); // FIXED: Reduced height
            doc.fillColor(darkGray)
               .fontSize(10)
               .font('Helvetica-Bold')
               .text('Description', leftMargin + 10, currentY + 6);
            doc.text('Amount', rightMargin - 80, currentY + 6, { align: 'right', width: 70 });
            
            currentY += 20;

            // Breakdown items
            breakdown.forEach((item, index) => {
                const yPos = currentY + (index * 16); // FIXED: Reduced spacing
                
                doc.fillColor(lightGray)
                   .fontSize(9)
                   .font('Helvetica')
                   .text(item.description, leftMargin + 10, yPos + 3);
                
                doc.fillColor(darkGray)
                   .fontSize(9)
                   .font('Helvetica')
                   .text(`₹${item.amount.toLocaleString('en-IN')}`, rightMargin - 80, yPos + 3, { align: 'right', width: 70 });
                
                // Light separator line
                if (index < breakdown.length - 1) {
                    drawLine(leftMargin, yPos + 14, rightMargin, yPos + 14, '#e2e8f0', 0.5);
                }
            });
            
            currentY += (breakdown.length * 16) + 8;
            
            // Total section with background
            drawBox(leftMargin, currentY, pageWidth, 30, primaryColor); // FIXED: Reduced height
            doc.fillColor('white')
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('Total Amount Paid', leftMargin + 10, currentY + 8);
            
            doc.fontSize(14)
               .text(`₹${booking.totalPrice.toLocaleString('en-IN')}`, rightMargin - 120, currentY + 6, { align: 'right', width: 110 });
            
            currentY += 45;

            // Payment Status
            doc.fillColor(successGreen)
               .fontSize(11)
               .font('Helvetica-Bold')
               .text('✓ Payment Confirmed', leftMargin, currentY);
            
            doc.fillColor(lightGray)
               .fontSize(9)
               .font('Helvetica')
               .text(`Payment processed on ${new Date(booking.bookingDate).toLocaleDateString('en-US', { 
                   year: 'numeric', 
                   month: 'long', 
                   day: 'numeric' 
               })}`, leftMargin, currentY + 12);
            
            currentY += 35;

            // Footer section
            drawLine(leftMargin, currentY, rightMargin, currentY, lightGray, 1);
            currentY += 15;
            
            // Terms and contact info
            doc.fillColor(lightGray)
               .fontSize(8) // FIXED: Reduced font size
               .font('Helvetica')
               .text('Terms & Conditions: This invoice serves as confirmation of your booking. Please present this document during check-in.', 
                     leftMargin, currentY, { width: pageWidth });
            
            currentY += 20;
            
            doc.text('Questions? Contact our support team at support@staybooker.com or +91-XXXX-XXXX-XXX', 
                     leftMargin, currentY, { width: pageWidth });
            
            currentY += 20;
            
            // Thank you message
            doc.fillColor(primaryColor)
               .fontSize(11)
               .font('Helvetica-Bold')
               .text('Thank you for choosing StayBooker!', leftMargin, currentY, { align: 'center', width: pageWidth });
            
            // Add page number if needed
            doc.fillColor(lightGray)
               .fontSize(8)
               .font('Helvetica')
               .text(`Page 1 of 1 | Generated on ${new Date().toLocaleDateString('en-US')}`, 
                     leftMargin, doc.page.height - 30, { align: 'center', width: pageWidth });

            doc.end();
            
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generatePDF };