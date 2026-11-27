import { resolveFieldNote } from '@/constants/field-notes'
import { CampWeather } from '@/enums/camp-weather'
import type { CampWeatherStation } from '@/types/views'

interface ClimatePreset {
  weather: CampWeather
  weatherLabel: string
  temperatureC: number
  bonusPercent: number
  bonusLabel: string
  locationLabel: string
}

const CLIMATE_BY_MONTH: Record<number, ClimatePreset> = {
  1: {
    weather: CampWeather.Mist,
    weatherLabel: '薄雾',
    temperatureC: 6,
    bonusPercent: 4,
    bonusLabel: '冬雾凝露 · 常绿观叶微升',
    locationLabel: '温室观测台'
  },
  2: {
    weather: CampWeather.Cloudy,
    weatherLabel: '多云',
    temperatureC: 10,
    bonusPercent: 3,
    bonusLabel: '回暖云幕 · 芽点活跃',
    locationLabel: '温室观测台'
  },
  3: {
    weather: CampWeather.Sunny,
    weatherLabel: '晴',
    temperatureC: 16,
    bonusPercent: 7,
    bonusLabel: '春光斜照 · 新叶光合增强',
    locationLabel: '露台温室'
  },
  4: {
    weather: CampWeather.Sunny,
    weatherLabel: '晴',
    temperatureC: 20,
    bonusPercent: 9,
    bonusLabel: '清明暖阳 · 花部识别加成',
    locationLabel: '露台温室'
  },
  5: {
    weather: CampWeather.Sunny,
    weatherLabel: '晴',
    temperatureC: 24,
    bonusPercent: 8,
    bonusLabel: '立夏晴稳 · 叶片定型加成',
    locationLabel: '露台温室'
  },
  6: {
    weather: CampWeather.Rainy,
    weatherLabel: '阵雨',
    temperatureC: 27,
    bonusPercent: 6,
    bonusLabel: '湿热雨幕 · 藤本吸水增强',
    locationLabel: '温室观测台'
  },
  7: {
    weather: CampWeather.Sunny,
    weatherLabel: '晴热',
    temperatureC: 31,
    bonusPercent: 5,
    bonusLabel: '盛夏强光 · 耐旱株系微升',
    locationLabel: '遮荫温室'
  },
  8: {
    weather: CampWeather.Cloudy,
    weatherLabel: '多云',
    temperatureC: 29,
    bonusPercent: 4,
    bonusLabel: '立秋云隙 · 果型复核加成',
    locationLabel: '露台温室'
  },
  9: {
    weather: CampWeather.Mist,
    weatherLabel: '晨露',
    temperatureC: 23,
    bonusPercent: 7,
    bonusLabel: '白露凝珠 · 色彩辨识增强',
    locationLabel: '露台温室'
  },
  10: {
    weather: CampWeather.Sunny,
    weatherLabel: '晴',
    temperatureC: 18,
    bonusPercent: 8,
    bonusLabel: '寒露秋色 · 木本战力上升',
    locationLabel: '露台温室'
  },
  11: {
    weather: CampWeather.Sunny,
    weatherLabel: '晴',
    temperatureC: 22,
    bonusPercent: 8,
    bonusLabel: '仲秋晴暖 · 观叶战力微升',
    locationLabel: '温室观测台'
  },
  12: {
    weather: CampWeather.Cloudy,
    weatherLabel: '阴',
    temperatureC: 8,
    bonusPercent: 3,
    bonusLabel: '冬室柔光 · 盆栽稳态维持',
    locationLabel: '温室观测台'
  }
}

export function resolveCampWeatherStation(date: Date = new Date()): CampWeatherStation {
  const month = date.getMonth() + 1
  const fieldNote = resolveFieldNote(date)
  const climate = CLIMATE_BY_MONTH[month] ?? {
    weather: CampWeather.Sunny,
    weatherLabel: '晴',
    temperatureC: 22,
    bonusPercent: 8,
    bonusLabel: '仲秋晴暖 · 观叶战力微升',
    locationLabel: '温室观测台'
  }
  return {
    seasonLabel: fieldNote.seasonLabel,
    weather: climate.weather,
    weatherLabel: climate.weatherLabel,
    temperatureC: climate.temperatureC,
    bonusPercent: climate.bonusPercent,
    bonusLabel: climate.bonusLabel,
    atmosphereHint: fieldNote.message,
    locationLabel: climate.locationLabel
  }
}

export function applyClimateCombatBonus(baseCombatPower: number, bonusPercent: number): number {
  return Math.round(baseCombatPower * (1 + bonusPercent / 100))
}
