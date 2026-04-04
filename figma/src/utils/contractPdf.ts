import { jsPDF } from 'jspdf';

export interface ContractPdfSignature {
  signedBy: string;
  signedAt: string;
}

export interface ContractPdfData {
  id: string;
  createdAt: string;
  status: 'active' | 'completed' | 'pending_client' | 'pending_artist' | 'draft' | 'cancelled';
  artistName: string;
  artistEmail?: string;
  clientName: string;
  artistWhatsapp?: string;
  clientWhatsapp?: string;
  clientEmail?: string;
  specialRequests?: string;
  providerName?: string;
  serviceName?: string;
  artistSignature?: ContractPdfSignature;
  clientSignature?: ContractPdfSignature;
  metadata?: {
    saleType?: 'time' | 'unit';
    unitLabel?: string;
    clientLegalName?: string;
    clientRepresentativeName?: string;
    providerBusinessName?: string;
    providerRepresentative?: {
      type?: 'person' | 'company';
      name?: string;
      documentType?: 'CI' | 'RIF';
      documentNumber?: string;
    };
    providerRepresentativeName?: string;
    providerLegalEntityType?: 'person' | 'company';
    providerIdentificationNumber?: string;
  };
  terms: {
    measureType?: 'time' | 'unit';
    measureLabel?: string;
    duration: number;
    startTime?: string;
    date: string;
    price: number | string;
    location: string;
    serviceDescription: string;
    paymentTerms: string;
    cancellationPolicy: string;
    additionalTerms: string[];
    specialRequests?: string;
  };
}

const formatDate = (date: string) => new Date(date).toLocaleDateString('es-ES');
const formatDateTime = (date: string) => new Date(date).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });

const sanitizeFileName = (value: string) => value.replace(/[^a-z0-9-_]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

const formatCurrency = (value: number | string) => {
  const numericValue = typeof value === 'number'
    ? value
    : Number(String(value).replace(/[^\d.-]/g, ''));

  if (Number.isFinite(numericValue)) {
    return `$${numericValue.toFixed(2)}`;
  }

  return `$${String(value)}`;
};

const getMeasureType = (contract: ContractPdfData): 'time' | 'unit' => {
  if (contract.metadata?.saleType === 'unit' || contract.terms.measureType === 'unit') {
    return 'unit';
  }

  return 'time';
};

const getMeasureLabel = (contract: ContractPdfData) => {
  if (getMeasureType(contract) === 'unit') {
    return `${contract.terms.duration} ${String(contract.metadata?.unitLabel || contract.terms.measureLabel || 'unidad(es)')}`;
  }

  return `${contract.terms.duration} ${contract.terms.duration === 1 ? 'hora' : 'horas'}`;
};

const getMeasureTitle = (contract: ContractPdfData) => {
  if (getMeasureType(contract) === 'unit') {
    return contract.terms.startTime ? 'Hora y Cantidad' : 'Cantidad';
  }

  return contract.terms.startTime ? 'Hora y Duración' : 'Duración';
};

const getVisibleClientContactLines = (contract: ContractPdfData) => {
  const lines: string[] = [];

  if (contract.clientEmail) {
    lines.push(contract.clientEmail);
  }

  if (contract.clientWhatsapp) {
    lines.push(contract.clientWhatsapp);
  }

  return lines;
};

const getServiceDescriptionLines = (contract: ContractPdfData) =>
  contract.terms.serviceDescription
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const getPlanName = (contract: ContractPdfData) => {
  const [firstLine = ''] = getServiceDescriptionLines(contract);
  const separatorIndex = firstLine.indexOf(':');

  if (separatorIndex <= 0) {
    return '';
  }

  return firstLine.slice(0, separatorIndex).trim();
};

const getIncludedItems = (contract: ContractPdfData) => {
  const normalizeIncludedLine = (rawLine: string) => {
    const line = String(rawLine || '').trim();
    if (!line) return '';

    // Remove only list markers (bullet or numeric list marker like 1. / 1)).
    // Keep quantities such as "100 Flayer..." intact.
    return line.replace(/^(?:[-•]\s*|\d+[.)]\s+)/, '').trim();
  };

  const lines = getServiceDescriptionLines(contract);
  const includeIndex = lines.findIndex((line) => /^incluye:?$/i.test(line));

  if (includeIndex >= 0) {
    return lines
      .slice(includeIndex + 1)
      .map(normalizeIncludedLine)
      .filter(Boolean);
  }

  const [firstLine = ''] = lines;
  const separatorIndex = firstLine.indexOf(':');
  if (separatorIndex > 0) {
    const summary = firstLine.slice(separatorIndex + 1).trim();
    return summary ? [summary] : [];
  }

  return lines.map(normalizeIncludedLine).filter(Boolean);
};

const SPECIAL_REQUEST_PREFIX_REGEX = /^solicitudes?\s+especial(?:es)?\s+del\s+cliente\s*:\s*/i;

const extractSpecialRequest = (contract: ContractPdfData) => {
  const explicitSpecialRequest = String(contract.terms.specialRequests || contract.specialRequests || '').trim();
  const filteredAdditionalTerms: string[] = [];
  let parsedSpecialRequest = '';

  contract.terms.additionalTerms.forEach((term) => {
    const trimmed = String(term || '').trim();
    if (!trimmed) {
      return;
    }

    if (SPECIAL_REQUEST_PREFIX_REGEX.test(trimmed)) {
      if (!parsedSpecialRequest) {
        parsedSpecialRequest = trimmed.replace(SPECIAL_REQUEST_PREFIX_REGEX, '').trim();
      }
      return;
    }

    filteredAdditionalTerms.push(trimmed);
  });

  return {
    specialRequest: explicitSpecialRequest || parsedSpecialRequest,
    additionalTermsWithoutSpecialRequest: filteredAdditionalTerms,
  };
};

export const downloadContractPdf = (
  contract: ContractPdfData,
  userType: 'client' | 'artist',
  options?: {
    providerName?: string;
    providerRepresentativeName?: string;
    providerLegalEntityType?: 'person' | 'company';
    providerIdentificationNumber?: string;
    providerEmail?: string;
    providerPhone?: string;
    clientName?: string;
    serviceName?: string;
    eventName?: string;
  }
) => {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 54;
  const contentWidth = pageWidth - margin * 2;
  let y = 64;
  const serviceName = options?.serviceName || contract.serviceName || contract.artistName;
  const eventName = options?.eventName || 'Evento no especificado';
  const clientLegalName = options?.clientName || contract.metadata?.clientLegalName || contract.clientName;
  const providerName =
    options?.providerName ||
    contract.metadata?.providerBusinessName ||
    contract.providerName ||
    contract.artistName;
  const providerRepresentative = contract.metadata?.providerRepresentative || {};
  const providerLegalEntityType =
    (options?.providerLegalEntityType || providerRepresentative.type || contract.metadata?.providerLegalEntityType) === 'company' ? 'company' : 'person';
  const providerIdentificationLabel = String(providerRepresentative.documentType || (providerLegalEntityType === 'company' ? 'RIF' : 'CI')).toUpperCase() === 'RIF' ? 'RIF' : 'CI';
  const providerRepresentativeFieldLabel = providerLegalEntityType === 'company' ? 'Razón social (RIF)' : 'Nombre (CI)';
  const providerIdentificationNumber = String(options?.providerIdentificationNumber || providerRepresentative.documentNumber || contract.metadata?.providerIdentificationNumber || '').trim();
  const providerRepresentativeName = String(
    options?.providerRepresentativeName ||
    providerRepresentative.name ||
    contract.metadata?.providerRepresentativeName ||
    contract.artistSignature?.signedBy ||
    providerName
  ).trim();
  const providerRepresentativeDetail = providerIdentificationNumber && !providerRepresentativeName.includes(providerIdentificationNumber)
    ? `${providerRepresentativeName} (${providerIdentificationLabel}: ${providerIdentificationNumber})`
    : providerRepresentativeName;
  const providerEmail = options?.providerEmail || contract.artistEmail;
  const providerPhone = options?.providerPhone || contract.artistWhatsapp;
  const planName = getPlanName(contract);
  const includedItems = getIncludedItems(contract);
  const { specialRequest, additionalTermsWithoutSpecialRequest } = extractSpecialRequest(contract);

  const ensureSpace = (height: number) => {
    if (y + height > pageHeight - 70) {
      pdf.addPage();
      y = 64;
      drawHeader(false);
    }
  };

  const addParagraph = (text: string, options?: { fontSize?: number; bold?: boolean; color?: readonly [number, number, number]; gapAfter?: number; indent?: number; width?: number; }) => {
    const fontSize = options?.fontSize ?? 11;
    const bold = options?.bold ?? false;
    const color = options?.color ?? ([31, 41, 55] as const);
    const gapAfter = options?.gapAfter ?? 10;
    const indent = options?.indent ?? 0;
    const width = options?.width ?? (contentWidth - indent);
    const lines = pdf.splitTextToSize(text?.trim() ? text : '-', width);
    ensureSpace(lines.length * (fontSize + 2) + gapAfter);
    pdf.setFont('times', bold ? 'bold' : 'normal');
    pdf.setFontSize(fontSize);
    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.text(lines, margin + indent, y);
    y += lines.length * (fontSize + 2) + gapAfter;
  };

  const addSectionTitle = (title: string) => {
    ensureSpace(30);
    pdf.setDrawColor(180, 180, 180);
    pdf.line(margin, y + 8, pageWidth - margin, y + 8);
    pdf.setFont('times', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(17, 24, 39);
    pdf.text(title, margin, y);
    y += 22;
  };

  const addLabelValue = (label: string, value: string) => {
    addParagraph(label, { fontSize: 11, bold: true, gapAfter: 4 });
    addParagraph(value, { fontSize: 11, gapAfter: 10 });
  };

  const addBulletItems = (items: string[]) => {
    items.forEach((item) => addParagraph(`• ${item}`, { fontSize: 11, gapAfter: 4, indent: 12, width: contentWidth - 12 }));
    y += 4;
  };

  const addServiceTable = (service: string, quantity: string, price: string) => {
    const headers = ['Servicio', 'Cantidad', 'Precio'];
    const row = [service, quantity, price];
    const tableWidth = contentWidth;
    const colWidths = [tableWidth * 0.5, tableWidth * 0.25, tableWidth * 0.25];
    const headerHeight = 26;
    const rowHeight = 34;

    ensureSpace(headerHeight + rowHeight + 20);
    let x = margin;
    pdf.setDrawColor(204, 204, 204);
    headers.forEach((header, i) => {
      pdf.setFillColor(245, 245, 245);
      pdf.rect(x, y, colWidths[i], headerHeight, 'FD');
      pdf.setFont('times', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(31, 41, 55);
      if (i === 0) {
        pdf.text(header, x + 10, y + 17);
      } else if (i === 1) {
        pdf.text(header, x + colWidths[i] / 2, y + 17, { align: 'center' });
      } else {
        pdf.text(header, x + colWidths[i] - 10, y + 17, { align: 'right' });
      }
      x += colWidths[i];
    });

    x = margin;
    row.forEach((cell, i) => {
      pdf.setDrawColor(214, 214, 214);
      pdf.setFillColor(255, 255, 255);
      pdf.rect(x, y + headerHeight, colWidths[i], rowHeight, 'FD');
      pdf.setFont('times', 'normal');
      pdf.setFontSize(11);
      const lines = pdf.splitTextToSize(cell, colWidths[i] - 12);
      if (i === 1) {
        pdf.text(lines, x + colWidths[i] / 2, y + headerHeight + 19, { align: 'center' });
      } else if (i === 2) {
        pdf.text(lines, x + colWidths[i] - 8, y + headerHeight + 16, { align: 'right' });
      } else {
        pdf.text(lines, x + 8, y + headerHeight + 19);
      }
      x += colWidths[i];
    });

    y += headerHeight + rowHeight + 20;
  };

  const drawHeader = (includeTitle: boolean) => {
    if (!includeTitle) {
      pdf.setDrawColor(210, 210, 210);
      pdf.line(margin, 38, pageWidth - margin, 38);
      pdf.setFont('times', 'italic');
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Contrato ${contract.id}`, margin, 28);
      return;
    }

    pdf.setFont('times', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(17, 24, 39);
    pdf.text('Contrato de Servicios', pageWidth / 2, y, { align: 'center' });
    y += 24;
    pdf.setFont('times', 'normal');
    pdf.setFontSize(11);
    pdf.text(`Contrato ID: ${contract.id}`, margin, y);
    pdf.text(`Fecha de emisión: ${formatDate(contract.createdAt)}`, pageWidth - margin, y, { align: 'right' });
    y += 18;
    pdf.setDrawColor(180, 180, 180);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 20;
  };

  drawHeader(true);

  addParagraph(
    `El Cliente, ${clientLegalName.toUpperCase()}, contrata el servicio de ${serviceName} al Proveedor, ${providerName.toUpperCase()}, representado por ${providerRepresentativeDetail.toUpperCase()}. El servicio se llevará a cabo el día ${formatDate(contract.terms.date)} en la ciudad de ${contract.terms.location}. El objeto del presente contrato consiste en la prestación del servicio de ${serviceName}${planName ? ` bajo el plan ${planName.toUpperCase()}` : ''}.`,
    { fontSize: 11, gapAfter: includedItems.length > 0 ? 8 : 12 }
  );

  if (includedItems.length > 0) {
    addParagraph('Que incluye:', { fontSize: 11, bold: true, gapAfter: 8 });
    addBulletItems(includedItems);
  }

  if (specialRequest) {
    addParagraph('Solicitud adicional del cliente:', { fontSize: 11, bold: true, gapAfter: 6 });
    addParagraph(specialRequest, { fontSize: 11, gapAfter: 12 });
  }

  addServiceTable(serviceName, getMeasureLabel(contract), formatCurrency(contract.terms.price));

  addSectionTitle('Términos y Condiciones');
  addLabelValue('1. Términos de Pago', contract.terms.paymentTerms);
  addLabelValue('2. Política de Cancelación', contract.terms.cancellationPolicy);

  if (additionalTermsWithoutSpecialRequest.length > 0) {
    addParagraph('3. Términos Adicionales', { fontSize: 11, bold: true, gapAfter: 8 });
    addBulletItems(additionalTermsWithoutSpecialRequest);
  }

  addParagraph('Importante: Al firmar este contrato, ambas partes aceptan cumplir con todos los términos y condiciones descritos. Este contrato es legalmente vinculante y establece las responsabilidades de cada parte.', {
    fontSize: 11,
    gapAfter: 16
  });

  addSectionTitle('Partes del Contrato');
  const clientLines = [
    clientLegalName,
    ...getVisibleClientContactLines(contract),
    contract.clientSignature ? `Firmado y aceptado el ${formatDateTime(contract.clientSignature.signedAt)}` : 'Pendiente de aceptación electrónica'
  ];
  const providerLines = [
    providerName,
    `${providerRepresentativeFieldLabel}: ${providerRepresentativeDetail}`,
    ...(providerEmail ? [providerEmail] : []),
    ...(providerPhone ? [providerPhone] : []),
    contract.artistSignature ? `Firmado y aceptado el ${formatDateTime(contract.artistSignature.signedAt)}` : 'Pendiente de aceptación electrónica'
  ];
  const columnGap = 24;
  const columnWidth = (contentWidth - columnGap) / 2;
  const clientHeight = clientLines.reduce((sum, line) => sum + pdf.splitTextToSize(line, columnWidth - 24).length * 13 + 8, 28);
  const providerHeight = providerLines.reduce((sum, line) => sum + pdf.splitTextToSize(line, columnWidth - 24).length * 13 + 8, 28);
  const blockHeight = Math.max(providerHeight, clientHeight) + 12;
  ensureSpace(blockHeight);
  const signatureTop = y;
  pdf.setDrawColor(170, 170, 170);
  pdf.setFillColor(255, 255, 255);
  pdf.rect(margin, signatureTop, columnWidth, blockHeight, 'FD');
  pdf.rect(margin + columnWidth + columnGap, signatureTop, columnWidth, blockHeight, 'FD');

  const drawPartyColumn = (x: number, title: string, lines: string[]) => {
    let cursorY = signatureTop + 20;
    pdf.setFont('times', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(31, 41, 55);
    pdf.text(title, x + 12, cursorY);
    cursorY += 18;
    lines.forEach((line, index) => {
      const split = pdf.splitTextToSize(line, columnWidth - 24);
      pdf.setFont('times', index === 0 ? 'bold' : 'normal');
      pdf.setFontSize(index === 0 ? 12 : 11);
      pdf.setTextColor(31, 41, 55);
      pdf.text(split, x + 12, cursorY);
      cursorY += split.length * ((index === 0 ? 12 : 11) + 2) + 8;
    });
  };

  drawPartyColumn(margin, 'Cliente', clientLines);
  drawPartyColumn(margin + columnWidth + columnGap, 'Proveedor de Servicios', providerLines);
  y += blockHeight + 14;

  const totalPages = pdf.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(210, 210, 210);
    pdf.line(margin, pageHeight - 36, pageWidth - margin, pageHeight - 36);
    pdf.setFont('times', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128);
    pdf.text(`Memorialo | Contrato ${contract.id}`, margin, pageHeight - 20);
    pdf.text(`Página ${page} de ${totalPages}`, pageWidth - margin, pageHeight - 20, { align: 'right' });
  }

  pdf.save(`contrato-${sanitizeFileName(contract.id)}.pdf`);
};