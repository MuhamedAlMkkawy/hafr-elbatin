import Logo from "@/assets/images/export_logo.png";

export const drawPdfHeader = (doc, authStore, isArabic, title = "", fromDate = "", toDate = "", month = "", year = "") => {
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;
  const rightX = isArabic ? pageWidth - margin : margin;
  const leftX = isArabic ? margin : pageWidth - margin;
  const align = isArabic ? "right" : "left";
  const leftAlign = isArabic ? "left" : "right";

  // Convert to strings to ensure jsPDF compatibility
  fromDate = String(fromDate).trim();
  toDate = String(toDate).trim();
  month = String(month).trim();
  year = String(year).trim();
  title = String(title).trim();

  // Clear empty values
  if (fromDate === "undefined" || fromDate === "null" || fromDate === "") fromDate = "";
  if (toDate === "undefined" || toDate === "null" || toDate === "") toDate = "";
  if (month === "undefined" || month === "null" || month === "") month = "";
  if (year === "undefined" || year === "null" || year === "") year = "";

  doc.setFont("IBMPlexSansArabic", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  // Right Section (Ministry Info)
  doc.setTextColor(14, 95, 74); // #0E5F4A
  if (isArabic) {
    doc.text("المملكة العربية السعودية", rightX, 15, { align });
    doc.setTextColor(0, 0, 0); // Back to black
    doc.text("وزارة البلديات والإسكان", rightX, 20, { align });
    doc.text("أمانة محافظة حفر الباطن", rightX, 25, { align });
  } else {
    doc.text("Kingdom of Saudi Arabia", rightX, 15, { align });
    doc.setTextColor(0, 0, 0); // Back to black
    doc.text("Ministry of Municipalities and Housing", rightX, 20, { align });
    doc.text("Hafar Al-Batin Municipality", rightX, 25, { align });
  }

  // Center Section (Logo with Borders)
  const img = new Image();
  img.src = Logo;
  const logoWidth = 30;
  const logoX = pageWidth / 2 - logoWidth / 2;
  doc.addImage(img, "PNG", logoX, 10, logoWidth, 18);

  // Vertical Borders for Logo (matching PrintHeader)
  doc.setDrawColor(241, 241, 241); // #F1F1F1
  doc.setLineWidth(0.3);
  doc.line(logoX - 5, 8, logoX - 5, 30);
  doc.line(logoX + logoWidth + 5, 8, logoX + logoWidth + 5, 30);

  // Left Section (User/Meta)
  const userName = authStore.user?.name || "---";
  const dateStr = new Date().toLocaleDateString("en-CA");
  const timeStr = new Date().toLocaleTimeString(isArabic ? "ar-EG" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  doc.text(`${isArabic ? "المستخدم:" : "User:"} ${userName}`, leftX, 15, {
    align: leftAlign,
  });
  doc.text(`${isArabic ? "التاريخ:" : "Date:"} ${dateStr}`, leftX, 20, {
    align: leftAlign,
  });
  doc.text(`${isArabic ? "الوقت:" : "Time:"} ${timeStr}`, leftX, 25, {
    align: leftAlign,
  });

  // Divider
  doc.setDrawColor(14, 95, 74);
  doc.setLineWidth(0.5);
  doc.line(margin, 32, pageWidth - margin, 32);

  // Subtitle Section (Title and Dates)
  if (title || fromDate || toDate) {
    let currentY = 40;

    if (title) {
      doc.setFont("IBMPlexSansArabic", "normal");
      doc.setFontSize(10); // 14px approx
      doc.setTextColor(56, 66, 80); // #384250
      
      // Fix RTL Colon: draw text without colon, then add colon manually to avoid flip
      const labelStr = isArabic ? "عنوان التقرير" : "Report Title";
      const colonStr = ":";
      
      doc.text(labelStr, rightX, currentY, { align });
      const labelWidth = doc.getTextWidth(labelStr);
      
      // Draw colon immediately after label
      const colonX = isArabic ? rightX - labelWidth : rightX + labelWidth;
      doc.text(colonStr, colonX, currentY, { align: isArabic ? "right" : "left" });
      
      const fullLabelWidth = labelWidth + doc.getTextWidth(colonStr);
      const valueX = isArabic ? rightX - fullLabelWidth - 2 : rightX + fullLabelWidth + 2;

      doc.setFont("IBMPlexSansArabic", "bold");
      doc.setFontSize(11); // Reduced from 12 (approx 14px-15px)
      doc.setTextColor(0, 0, 0);
      
      // Handle long titles by splitting text
      const maxWidth = pageWidth - (margin * 2) - 40; // Account for label space
      const titleLines = doc.splitTextToSize(title, maxWidth);
      
      if (titleLines.length === 1) {
        doc.text(title, valueX, currentY, { align });
      } else {
        // Multi-line title
        titleLines.forEach((line, index) => {
          doc.text(line, valueX, currentY + (index * 5), { align });
        });
        currentY += (titleLines.length - 1) * 5;
      }
      
      currentY += 7; // Reduced spacing
    }

    if (fromDate || toDate || month || year) {
      doc.setFont("IBMPlexSansArabic", "normal");
      doc.setFontSize(10);
      doc.setTextColor(56, 66, 80); // #384250

      let dateX = rightX;

      // Display month and year if they exist
      if ((month || year) && !fromDate && !toDate) {
        if (month) {
          const monthLabel = isArabic ? "الشهر" : "Month";
          const colonStr = ":";
          doc.text(monthLabel, dateX, currentY, { align });

          const labelWidth = doc.getTextWidth(monthLabel);
          const colonX = isArabic ? dateX - labelWidth : dateX + labelWidth;
          doc.text(colonStr, colonX, currentY, {
            align: isArabic ? "right" : "left",
          });

          const fullLabelWidth = labelWidth + doc.getTextWidth(colonStr);
          const valueX = isArabic
            ? dateX - fullLabelWidth - 2
            : dateX + fullLabelWidth + 2;

          doc.setFont("IBMPlexSansArabic", "bold");
          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          doc.text(month, valueX, currentY, { align });

          const monthValueWidth = doc.getTextWidth(month);
          if (isArabic) {
            dateX = valueX - monthValueWidth - 10;
          } else {
            dateX = valueX + monthValueWidth + 10;
          }
        }

        if (year) {
          doc.setFont("IBMPlexSansArabic", "normal");
          doc.setFontSize(10);
          doc.setTextColor(56, 66, 80); // #384250

          const yearLabel = isArabic ? "السنة" : "Year";
          const colonStr = ":";
          doc.text(yearLabel, dateX, currentY, { align });

          const labelWidth = doc.getTextWidth(yearLabel);
          const colonX = isArabic ? dateX - labelWidth : dateX + labelWidth;
          doc.text(colonStr, colonX, currentY, {
            align: isArabic ? "right" : "left",
          });

          const fullLabelWidth = labelWidth + doc.getTextWidth(colonStr);
          const valueX = isArabic
            ? dateX - fullLabelWidth - 2
            : dateX + fullLabelWidth + 2;

          doc.setFont("IBMPlexSansArabic", "bold");
          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          doc.text(year, valueX, currentY, { align });
        }
      } else if (fromDate || toDate) {
        // Original date range handling
        if (fromDate && !toDate) {
          const dateLabel = isArabic ? "التاريخ" : "Date";
          const colonStr = ":";
          doc.text(dateLabel, dateX, currentY, { align });

          const labelWidth = doc.getTextWidth(dateLabel);
          const colonX = isArabic ? dateX - labelWidth : dateX + labelWidth;
          doc.text(colonStr, colonX, currentY, {
            align: isArabic ? "right" : "left",
          });

          const fullLabelWidth = labelWidth + doc.getTextWidth(colonStr);
          const valueX = isArabic
            ? dateX - fullLabelWidth - 2
            : dateX + fullLabelWidth + 2;

          doc.setFont("IBMPlexSansArabic", "bold");
          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          doc.text(fromDate, valueX, currentY, { align });
        } else {
          if (fromDate) {
            const fromLabel = isArabic ? "من تاريخ" : "From Date";
            const colonStr = ":";
            doc.text(fromLabel, dateX, currentY, { align });

            const fLabelWidth = doc.getTextWidth(fromLabel);
            const fColonX = isArabic ? dateX - fLabelWidth : dateX + fLabelWidth;
            doc.text(colonStr, fColonX, currentY, {
              align: isArabic ? "right" : "left",
            });

            const fullFLabelWidth = fLabelWidth + doc.getTextWidth(colonStr);
            const fromValueX = isArabic
              ? dateX - fullFLabelWidth - 2
              : dateX + fullFLabelWidth + 2;

            doc.setFont("IBMPlexSansArabic", "bold");
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text(fromDate, fromValueX, currentY, { align });

            // Move X for To Date
            const fromValueWidth = doc.getTextWidth(fromDate);
            if (isArabic) {
              dateX = fromValueX - fromValueWidth - 10;
            } else {
              dateX = fromValueX + fromValueWidth + 10;
            }
          }

          if (toDate) {
            doc.setFont("IBMPlexSansArabic", "normal");
            doc.setFontSize(10);
            doc.setTextColor(56, 66, 80); // #384250

            const toLabel = isArabic ? "إلى تاريخ" : "To Date";
            const colonStr = ":";
            doc.text(toLabel, dateX, currentY, { align });

            const tLabelWidth = doc.getTextWidth(toLabel);
            const tColonX = isArabic ? dateX - tLabelWidth : dateX + tLabelWidth;
            doc.text(colonStr, tColonX, currentY, {
              align: isArabic ? "right" : "left",
            });

            const fullTLabelWidth = tLabelWidth + doc.getTextWidth(colonStr);
            const toValueX = isArabic
              ? dateX - fullTLabelWidth - 2
              : dateX + fullTLabelWidth + 2;

            doc.setFont("IBMPlexSansArabic", "bold");
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text(toDate, toValueX, currentY, { align });
          }
        }
      }
    }
  }
};

