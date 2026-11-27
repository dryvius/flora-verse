export interface FieldNoteContent {
  seasonLabel: string
  message: string
}

const FIELD_NOTES_BY_MONTH: Record<number, FieldNoteContent> = {
  1: {
    seasonLabel: '岁首',
    message: '常绿枝叶仍可辨认，注意观察冬芽形态。'
  },
  2: {
    seasonLabel: '雨水',
    message: '早春嫩芽将出，适合记录芽鳞与叶序。'
  },
  3: {
    seasonLabel: '惊蛰',
    message: '新叶初展，对照叶缘与叶脉最易识种。'
  },
  4: {
    seasonLabel: '清明',
    message: '春花次第开放，记得补录花部特征。'
  },
  5: {
    seasonLabel: '立夏',
    message: '叶片定型，适合建立完整叶片档案。'
  },
  6: {
    seasonLabel: '芒种',
    message: '湿热季多肉质茎叶，注意区分科属细节。'
  },
  7: {
    seasonLabel: '小暑',
    message: '盛夏观花观果，避开正午强光拍摄。'
  },
  8: {
    seasonLabel: '立秋',
    message: '果实开始成熟，可对照果型复核物种。'
  },
  9: {
    seasonLabel: '白露',
    message: '晨露后色彩更清晰，适合户外短途收录。'
  },
  10: {
    seasonLabel: '寒露',
    message: '秋色叶变，银杏与槭属最易留下标本。'
  },
  11: {
    seasonLabel: '仲秋',
    message: '落叶与浆果最易辨认，适合补录木本。'
  },
  12: {
    seasonLabel: '大雪',
    message: '室内盆栽仍可收录，留意叶斑与株型。'
  }
}

export function resolveFieldNote(date: Date = new Date()): FieldNoteContent {
  const month = date.getMonth() + 1
  const note = FIELD_NOTES_BY_MONTH[month]
  if (note) {
    return note
  }
  return FIELD_NOTES_BY_MONTH[11] as FieldNoteContent
}
