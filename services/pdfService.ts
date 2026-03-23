import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Patient, DocumentConfig } from '../types';
import defaultLogoUrl from '../assets/prefeitura.jpg';


export const generatePatientDocument = async (patient: Patient, config: DocumentConfig): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); 
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let logoImage: any = null;

  try {
    const response = await fetch(defaultLogoUrl);
    const logoBytes = new Uint8Array(await response.arrayBuffer());
    logoImage = await pdfDoc.embedJpg(logoBytes);
  } catch (e) {
    console.error('Erro ao carregar logomarca padrão:', e);
  }

  
  const drawContent = (yOffset: number) => {
    const pageWidth = 595.28;
    const viaHeight = 420.94;
    const margin = 30;
    const contentWidth = pageWidth - (margin * 2);
    page.drawRectangle({
      x: margin - 10,
      y: yOffset + 15,
      width: contentWidth + 20,
      height: viaHeight - 30,
      borderWidth: 0.5,
      borderColor: rgb(0.8, 0.8, 0.8),
    });
    const startY = yOffset + 361;
    let textStartX = margin;
    if (logoImage) {
      const logoHeight = 45;
      const logoWidth = (logoImage.width / logoImage.height) * logoHeight;
      page.drawImage(logoImage, {
        x: margin,
        y: startY - 10,
        width: logoWidth,
        height: logoHeight,
      });
      textStartX = margin + logoWidth + 15;
    }

    const headerLines = [
      'Prefeitura Municipal de Itabuna',
      'Secretaria de Saúde',
      'Departamento de Regulação e Controle e Avaliação do S.U.S.',
      'Setor de Autorizações de Internamento Hospitalar (A.I.H)'
    ];

    let currentHeaderY = startY + 25;
    headerLines.forEach((line, idx) => {
      const fontSize = idx === 0 ? 10 : 8;
      const f = idx === 0 ? fontBold : font;

      const xPos = logoImage ? textStartX : (pageWidth - f.widthOfTextAtSize(line, fontSize)) / 2;

      page.drawText(line, {
        x: xPos,
        y: currentHeaderY,
        size: fontSize,
        font: f
      });
      currentHeaderY -= 11;
    });
    const mainTitle = 'Comprovante de Entrega de Documentos no Setor de A.I.H';
    const titleWidth = fontBold.widthOfTextAtSize(mainTitle, 12);
    page.drawText(mainTitle, {
      x: (pageWidth - titleWidth) / 2,
      y: startY - 35,
      size: 12,
      font: fontBold
    });
    const dataY = startY - 65;
    page.drawText('DADOS DO PACIENTE:', { x: margin, y: dataY, size: 9, font: fontBold });
    page.drawText(`NOME: ${patient.name.toUpperCase()}`, { x: margin, y: dataY - 14, size: 10, font });
    page.drawText(`Nº CADSUS: ${patient.cadSus}`, { x: margin, y: dataY - 28, size: 10, font });
    page.drawText(`TELEFONE: ${patient.phone}`, { x: margin + 250, y: dataY - 28, size: 10, font });
    const procY = dataY - 50;
    page.drawText('PROCEDIMENTO:', { x: margin, y: procY, size: 9, font: fontBold });
    const procLines = config.procedimento.split('\n');
    let currentProcLineY = procY - 14;
    procLines.slice(0, 3).forEach(line => {
      page.drawText(line.toUpperCase(), { x: margin, y: currentProcLineY, size: 9, font });
      currentProcLineY -= 11;
    });
    const cbY = dataY - 105;
    page.drawRectangle({
      x: margin,
      y: cbY,
      width: 10,
      height: 10,
      borderWidth: 0.5,
      borderColor: rgb(0, 0, 0),
      color: rgb(1, 1, 1)
    });
    if (config.isItabuna) page.drawText('X', { x: margin + 2, y: cbY + 2, size: 8, font: fontBold });
    page.drawText('ITABUNA', { x: margin + 15, y: cbY + 1, size: 10, font });
    page.drawRectangle({
      x: margin + 100,
      y: cbY,
      width: 10,
      height: 10,
      borderWidth: 0.5,
      borderColor: rgb(0, 0, 0),
      color: rgb(1, 1, 1)
    });
    if (config.isMPactuado) page.drawText('X', { x: margin + 102, y: cbY + 2, size: 8, font: fontBold });
    page.drawText('M. PACTUADO', { x: margin + 115, y: cbY + 1, size: 10, font });
    const dateStr = new Date(config.deliveryDate + 'T00:00:00').toLocaleDateString('pt-BR');
    const returnDateStr = new Date(config.returnDate + 'T00:00:00').toLocaleDateString('pt-BR');
    const deliveryText = `DATA DA ENTREGA: ${dateStr} `;
    const timeText = ` - HORÁRIO: ${config.printTime}`;
    page.drawText(deliveryText, { x: margin + 250, y: cbY + 1, size: 10, font: fontBold });
    const deliveryWidth = fontBold.widthOfTextAtSize(deliveryText, 10);
    page.drawText(timeText, { x: margin + 250 + deliveryWidth, y: cbY + 1, size: 10, font });
    page.drawText(`DATA DE RETORNO: ${returnDateStr}`, { x: margin + 250, y: cbY - 25, size: 10, font: fontBold });
    const sigY = yOffset + 130;
    const sigLineWidth = 250;
    const sigLineX = (pageWidth - sigLineWidth) / 2;
    page.drawLine({ start: { x: sigLineX, y: sigY }, end: { x: sigLineX + sigLineWidth, y: sigY }, thickness: 0.5 });
    page.drawText('Equipe Administrativa', { x: sigLineX + 75, y: sigY - 12, size: 9, font: fontBold });
    page.drawText('(Setor A.I.H de Cirurgias Eletivas)', { x: sigLineX + 55, y: sigY - 30, size: 8, font });
    const notesY = yOffset + 60;
    const notes = [
      'a- Comparecer pessoalmente - a partir das 10h (excepcionalmente).',
      'b- Guarde este comprovante e traga-o quando for pegar a autorização dentro do horário de atendimento.'
    ];

    let currentNoteY = notesY;
    notes.forEach(note => {
      const wrappedText = wrapText(note, contentWidth, 10, font);
      wrappedText.forEach(line => {
        page.drawText(line, { x: margin, y: currentNoteY, size: 10, font });
        currentNoteY -= 12;
      });
      currentNoteY -= 4;
    });
    page.drawText(yOffset > 0 ? '1ª VIA - SETOR A.I.H' : '2ª VIA - PACIENTE', {
      x: margin + 400,
      y: startY + 15,
      size: 7,
      font,
      color: rgb(0.5, 0.5, 0.5)
    });
  };

  function wrapText(text: string, maxWidth: number, fontSize: number, font: any) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = font.widthOfTextAtSize(currentLine + ' ' + word, fontSize);
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }

  drawContent(420.94); 

  page.drawLine({
    start: { x: 0, y: 420.94 },
    end: { x: 595.28, y: 420.94 },
    thickness: 0.5,
    dashArray: [4, 4],
    color: rgb(0.7, 0.7, 0.7),
  });
  page.drawText('LINHA DE CORTE', { x: 265, y: 416, size: 6, font, color: rgb(0.6, 0.6, 0.6) });

  drawContent(0); 

  return await pdfDoc.save();
};
