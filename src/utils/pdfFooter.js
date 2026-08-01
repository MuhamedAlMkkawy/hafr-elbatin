export const drawPdfFooter = (doc, authStore, pageNumber, totalPages, isArabic) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const userName = authStore.user?.name || '---';
  
  doc.setFont("IBMPlexSansArabic", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0);
  
  // Divider
  doc.setDrawColor(14, 95, 74);
  doc.setLineWidth(0.5);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

  // Right side (RTL): Page Number - Fixed total pages display
  const totalPagesDisplay = totalPages || pageNumber;
  const pageStr = isArabic ? `صفحة ${pageNumber} / ${totalPagesDisplay}` : `Page ${pageNumber} / ${totalPagesDisplay}`;
  doc.text(pageStr, isArabic ? pageWidth - margin : margin, pageHeight - 6, { align: isArabic ? 'right' : 'left' });

  // Left side (RTL): User - Fixed double colon issue
  const userLabel = isArabic ? 'المستخدم:' : 'User:';
  doc.text(`${userLabel} ${userName}`, isArabic ? margin : pageWidth - margin, pageHeight - 6, { align: isArabic ? 'left' : 'right' });
};
