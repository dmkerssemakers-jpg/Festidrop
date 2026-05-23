export type LabelStyle = 'solid' | 'accent-line' | 'gradient' | 'duotone' | 'dots' | 'grain';

export interface PolaroidDesign {
  // Frame
  frameColor:        string;
  // Label area
  labelBg:           string;
  labelTextColor:    string;
  labelStyle:        LabelStyle;   // visual decoration on the label
  labelTagline:      string;       // persistent text at bottom of label (max 40 chars)
  // Date stamp
  dateStamp:         boolean;
  dateStampColor:    string;
  dateStampPosition: 'left' | 'right';
  // Watermark
  watermark:         boolean;
  watermarkOpacity:  number;       // 0–50
  watermarkColor:    string;
  // Film
  filterStrength:    number;       // 0–100
  // Logo
  logoPosition:      'center' | 'bottom' | 'hidden';
}

export const DEFAULT_DESIGN: PolaroidDesign = {
  frameColor:        '#FEFDF8',
  labelBg:           '#FEFDF8',
  labelTextColor:    '#2C1810',
  labelStyle:        'solid',
  labelTagline:      '',
  dateStamp:         true,
  dateStampColor:    '#E8192C',
  dateStampPosition: 'left',
  watermark:         true,
  watermarkOpacity:  20,
  watermarkColor:    '#FFFFFF',
  filterStrength:    100,
  logoPosition:      'center',
};

const LABEL_STYLES: LabelStyle[] = ['solid','accent-line','gradient','duotone','dots','grain'];

export function parseDesign(json: unknown): PolaroidDesign {
  if (!json || typeof json !== 'object') return { ...DEFAULT_DESIGN };
  const d = json as Partial<PolaroidDesign>;
  return {
    frameColor:        typeof d.frameColor === 'string'       ? d.frameColor        : DEFAULT_DESIGN.frameColor,
    labelBg:           typeof d.labelBg === 'string'          ? d.labelBg           : DEFAULT_DESIGN.labelBg,
    labelTextColor:    typeof d.labelTextColor === 'string'   ? d.labelTextColor    : DEFAULT_DESIGN.labelTextColor,
    labelStyle:        LABEL_STYLES.includes(d.labelStyle as LabelStyle)
                         ? d.labelStyle as LabelStyle : DEFAULT_DESIGN.labelStyle,
    labelTagline:      typeof d.labelTagline === 'string'     ? d.labelTagline.slice(0, 40) : DEFAULT_DESIGN.labelTagline,
    dateStamp:         typeof d.dateStamp === 'boolean'       ? d.dateStamp         : DEFAULT_DESIGN.dateStamp,
    dateStampColor:    typeof d.dateStampColor === 'string'   ? d.dateStampColor    : DEFAULT_DESIGN.dateStampColor,
    dateStampPosition: d.dateStampPosition === 'right'        ? 'right'             : 'left',
    watermark:         typeof d.watermark === 'boolean'       ? d.watermark         : DEFAULT_DESIGN.watermark,
    watermarkOpacity:  typeof d.watermarkOpacity === 'number' ? d.watermarkOpacity  : DEFAULT_DESIGN.watermarkOpacity,
    watermarkColor:    typeof d.watermarkColor === 'string'   ? d.watermarkColor    : DEFAULT_DESIGN.watermarkColor,
    filterStrength:    typeof d.filterStrength === 'number'   ? d.filterStrength    : DEFAULT_DESIGN.filterStrength,
    logoPosition:      (['center','bottom','hidden'] as const).includes(d.logoPosition as 'center'|'bottom'|'hidden')
                         ? d.logoPosition as PolaroidDesign['logoPosition'] : DEFAULT_DESIGN.logoPosition,
  };
}
