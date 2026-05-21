export interface PolaroidDesign {
  frameColor:        string;           // polaroid border/background
  labelBg:           string;           // white label background
  labelTextColor:    string;           // note text + event name color
  dateStamp:         boolean;          // show Kodak date stamp
  dateStampColor:    string;           // stamp color
  dateStampPosition: 'left' | 'right';
  watermark:         boolean;          // event name text over photo
  watermarkOpacity:  number;           // 0–50
  watermarkColor:    string;           // watermark text color
  filterStrength:    number;           // 0–100 film filter intensity
  logoPosition:      'center' | 'bottom' | 'hidden';
}

export const DEFAULT_DESIGN: PolaroidDesign = {
  frameColor:        '#FEFDF8',
  labelBg:           '#FEFDF8',
  labelTextColor:    '#2C1810',
  dateStamp:         true,
  dateStampColor:    '#E8192C',
  dateStampPosition: 'left',
  watermark:         true,
  watermarkOpacity:  20,
  watermarkColor:    '#FFFFFF',
  filterStrength:    100,
  logoPosition:      'center',
};

export function parseDesign(json: unknown): PolaroidDesign {
  if (!json || typeof json !== 'object') return { ...DEFAULT_DESIGN };
  const d = json as Partial<PolaroidDesign>;
  return {
    frameColor:        typeof d.frameColor === 'string'       ? d.frameColor        : DEFAULT_DESIGN.frameColor,
    labelBg:           typeof d.labelBg === 'string'          ? d.labelBg           : DEFAULT_DESIGN.labelBg,
    labelTextColor:    typeof d.labelTextColor === 'string'   ? d.labelTextColor    : DEFAULT_DESIGN.labelTextColor,
    dateStamp:         typeof d.dateStamp === 'boolean'       ? d.dateStamp         : DEFAULT_DESIGN.dateStamp,
    dateStampColor:    typeof d.dateStampColor === 'string'   ? d.dateStampColor    : DEFAULT_DESIGN.dateStampColor,
    dateStampPosition: d.dateStampPosition === 'right'        ? 'right'             : 'left',
    watermark:         typeof d.watermark === 'boolean'       ? d.watermark         : DEFAULT_DESIGN.watermark,
    watermarkOpacity:  typeof d.watermarkOpacity === 'number' ? d.watermarkOpacity  : DEFAULT_DESIGN.watermarkOpacity,
    watermarkColor:    typeof d.watermarkColor === 'string'   ? d.watermarkColor    : DEFAULT_DESIGN.watermarkColor,
    filterStrength:    typeof d.filterStrength === 'number'   ? d.filterStrength    : DEFAULT_DESIGN.filterStrength,
    logoPosition:      (['center', 'bottom', 'hidden'] as const).includes(d.logoPosition as 'center' | 'bottom' | 'hidden')
                         ? d.logoPosition as PolaroidDesign['logoPosition']
                         : DEFAULT_DESIGN.logoPosition,
  };
}
