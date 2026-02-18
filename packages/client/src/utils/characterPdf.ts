import { jsPDF } from 'jspdf';
import type { Character, DotRating, ArcanosRating, Background, Passion, Fetter } from '@wraith/shared';

const MARGIN = 20;
const PAGE_WIDTH = 210; // A4 mm
const PAGE_HEIGHT = 297;
const COL_WIDTH = (PAGE_WIDTH - MARGIN * 2) / 3;
const LINE_HEIGHT = 5;
const SECTION_GAP = 8;

function drawDots(doc: jsPDF, x: number, y: number, filled: number, max: number = 5): void {
  const dotR = 1.5;
  const gap = 4;
  for (let i = 0; i < max; i++) {
    if (i < filled) {
      doc.setFillColor(80, 80, 80);
      doc.circle(x + i * gap, y, dotR, 'F');
    } else {
      doc.setDrawColor(160, 160, 160);
      doc.circle(x + i * gap, y, dotR, 'S');
    }
  }
}

function checkPageBreak(doc: jsPDF, y: number, needed: number = 15): number {
  if (y + needed > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
    return MARGIN + 10;
  }
  return y;
}

export function exportCharacterPdf(character: Character): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  doc.setFont('times', 'normal');
  let y = MARGIN;

  // ─── Title ─────────────────────────────────────────────────
  doc.setFontSize(22);
  doc.setFont('times', 'bold');
  doc.text(character.name, PAGE_WIDTH / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(10);
  doc.setFont('times', 'italic');
  doc.text('Wraith: The Oblivion — Character Sheet', PAGE_WIDTH / 2, y, { align: 'center' });
  y += 10;

  // ─── Identity ──────────────────────────────────────────────
  doc.setFontSize(9);
  doc.setFont('times', 'normal');

  const identityRows = [
    [`Player: ${character.player}`, `Concept: ${character.concept}`],
    [`Nature: ${character.nature}`, `Demeanor: ${character.demeanor}`],
    [`Cause of Death: ${character.causeOfDeath.replace('_', ' ')}`, `Legion: ${character.legion}`],
    [`Template: ${character.experienceTemplate}`, character.guild ? `Guild: ${character.guild}` : ''],
  ];

  for (const [left, right] of identityRows) {
    doc.text(left, MARGIN, y);
    if (right) doc.text(right, PAGE_WIDTH / 2, y);
    y += LINE_HEIGHT;
  }
  y += SECTION_GAP;

  // ─── Section Header ────────────────────────────────────────
  function sectionHeader(title: string): void {
    y = checkPageBreak(doc, y, 15);
    doc.setFontSize(11);
    doc.setFont('times', 'bold');
    doc.text(title, MARGIN, y);
    doc.setLineWidth(0.3);
    doc.setDrawColor(100, 100, 100);
    doc.line(MARGIN, y + 1.5, PAGE_WIDTH - MARGIN, y + 1.5);
    y += 7;
    doc.setFontSize(9);
    doc.setFont('times', 'normal');
  }

  // ─── Trait Row ─────────────────────────────────────────────
  function traitRow(label: string, rating: number, colX: number, rowY: number, max: number = 5): void {
    const displayLabel = label.replace(/([A-Z])/g, ' $1').trim();
    const capitalLabel = displayLabel.charAt(0).toUpperCase() + displayLabel.slice(1);
    doc.text(capitalLabel, colX, rowY);
    drawDots(doc, colX + 28, rowY - 0.5, rating, max);
  }

  // ─── Attributes ────────────────────────────────────────────
  sectionHeader('ATTRIBUTES');

  const attrCategories = [
    { label: 'Physical', data: character.attributes.physical },
    { label: 'Social', data: character.attributes.social },
    { label: 'Mental', data: character.attributes.mental },
  ];

  const attrStartY = y;
  for (let ci = 0; ci < attrCategories.length; ci++) {
    const cat = attrCategories[ci];
    const colX = MARGIN + ci * COL_WIDTH;
    let rowY = attrStartY;

    doc.setFont('times', 'bolditalic');
    doc.text(cat.label, colX, rowY);
    rowY += LINE_HEIGHT;
    doc.setFont('times', 'normal');

    for (const [key, val] of Object.entries(cat.data)) {
      traitRow(key, val as number, colX, rowY);
      rowY += LINE_HEIGHT;
    }
    if (ci === 0) y = rowY;
  }
  y += SECTION_GAP;

  // ─── Abilities ─────────────────────────────────────────────
  sectionHeader('ABILITIES');

  const abilCategories = [
    { label: 'Talents', data: character.abilities.talents },
    { label: 'Skills', data: character.abilities.skills },
    { label: 'Knowledges', data: character.abilities.knowledges },
  ];

  const abilStartY = y;
  let maxAbilY = y;
  for (let ci = 0; ci < abilCategories.length; ci++) {
    const cat = abilCategories[ci];
    const colX = MARGIN + ci * COL_WIDTH;
    let rowY = abilStartY;

    doc.setFont('times', 'bolditalic');
    doc.text(cat.label, colX, rowY);
    rowY += LINE_HEIGHT;
    doc.setFont('times', 'normal');

    for (const [key, val] of Object.entries(cat.data)) {
      rowY = checkPageBreak(doc, rowY, LINE_HEIGHT);
      traitRow(key, val as number, colX, rowY);
      rowY += LINE_HEIGHT;
    }
    if (rowY > maxAbilY) maxAbilY = rowY;
  }
  y = maxAbilY + SECTION_GAP;

  // ─── Backgrounds ───────────────────────────────────────────
  if (character.backgrounds.length > 0) {
    sectionHeader('BACKGROUNDS');
    for (const bg of character.backgrounds) {
      y = checkPageBreak(doc, y);
      traitRow(bg.name, bg.rating, MARGIN, y);
      y += LINE_HEIGHT;
    }
    y += SECTION_GAP;
  }

  // ─── Arcanoi ───────────────────────────────────────────────
  if (character.arcanoi.length > 0) {
    sectionHeader('ARCANOI');
    for (const arc of character.arcanoi) {
      y = checkPageBreak(doc, y);
      traitRow(arc.name, arc.rating, MARGIN, y);
      y += LINE_HEIGHT;
    }
    y += SECTION_GAP;
  }

  // ─── Passions ──────────────────────────────────────────────
  if (character.passions.length > 0) {
    sectionHeader('PASSIONS');
    for (const p of character.passions) {
      y = checkPageBreak(doc, y);
      doc.text(`${p.description} (${p.emotion})`, MARGIN, y);
      drawDots(doc, MARGIN + 70, y - 0.5, p.rating);
      y += LINE_HEIGHT;
    }
    y += SECTION_GAP;
  }

  // ─── Fetters ───────────────────────────────────────────────
  if (character.fetters.length > 0) {
    sectionHeader('FETTERS');
    for (const f of character.fetters) {
      y = checkPageBreak(doc, y);
      doc.text(`${f.description} (${f.type.replace('_', ' ')})`, MARGIN, y);
      drawDots(doc, MARGIN + 70, y - 0.5, f.rating);
      y += LINE_HEIGHT;
    }
    y += SECTION_GAP;
  }

  // ─── Resources ─────────────────────────────────────────────
  sectionHeader('RESOURCES');
  y = checkPageBreak(doc, y, 25);

  doc.setFont('times', 'bolditalic');
  doc.text('Corpus', MARGIN, y);
  doc.setFont('times', 'normal');
  drawDots(doc, MARGIN + 25, y - 0.5, character.resources.corpus.current, 10);
  y += LINE_HEIGHT;

  doc.setFont('times', 'bolditalic');
  doc.text('Pathos', MARGIN, y);
  doc.setFont('times', 'normal');
  drawDots(doc, MARGIN + 25, y - 0.5, character.resources.pathos.current, 10);
  y += LINE_HEIGHT;

  doc.setFont('times', 'bolditalic');
  doc.text('Willpower', MARGIN, y);
  doc.setFont('times', 'normal');
  drawDots(doc, MARGIN + 25, y - 0.5, character.resources.willpower.permanent, 10);
  y += LINE_HEIGHT;
  doc.text(`  Temporary: ${character.resources.willpower.temporary}`, MARGIN, y);
  y += LINE_HEIGHT + SECTION_GAP;

  // ─── Shadow ────────────────────────────────────────────────
  sectionHeader('SHADOW');
  y = checkPageBreak(doc, y, 20);

  doc.text(`Archetype: ${character.shadow.archetype}`, MARGIN, y);
  y += LINE_HEIGHT;

  doc.setFont('times', 'bolditalic');
  doc.text('Angst', MARGIN, y);
  doc.setFont('times', 'normal');
  drawDots(doc, MARGIN + 25, y - 0.5, character.shadow.angst.permanent, 10);
  y += LINE_HEIGHT;
  doc.text(`  Temporary: ${character.shadow.angst.temporary}`, MARGIN, y);
  y += LINE_HEIGHT + 3;

  if (character.shadow.darkPassions.length > 0) {
    doc.setFont('times', 'bolditalic');
    doc.text('Dark Passions', MARGIN, y);
    doc.setFont('times', 'normal');
    y += LINE_HEIGHT;
    for (const dp of character.shadow.darkPassions) {
      y = checkPageBreak(doc, y);
      doc.text(`${dp.description} (${dp.emotion})`, MARGIN + 4, y);
      drawDots(doc, MARGIN + 74, y - 0.5, dp.rating);
      y += LINE_HEIGHT;
    }
  }

  if (character.shadow.thorns.length > 0) {
    y += 3;
    doc.setFont('times', 'bolditalic');
    doc.text('Thorns', MARGIN, y);
    doc.setFont('times', 'normal');
    y += LINE_HEIGHT;
    for (const thorn of character.shadow.thorns) {
      y = checkPageBreak(doc, y);
      doc.text(`${thorn.name} (${thorn.pointCost} pt)`, MARGIN + 4, y);
      y += LINE_HEIGHT;
    }
  }

  // ─── Experience ────────────────────────────────────────────
  y += SECTION_GAP;
  y = checkPageBreak(doc, y, 12);
  sectionHeader('EXPERIENCE');
  doc.text(
    `Total: ${character.experience.total}   Spent: ${character.experience.spent}   Available: ${character.experience.available}`,
    MARGIN,
    y,
  );

  // ─── Download ──────────────────────────────────────────────
  const filename = `${character.name.replace(/[^a-zA-Z0-9]/g, '_')}_sheet.pdf`;
  doc.save(filename);
}
