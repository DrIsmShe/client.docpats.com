// src/pages/simulation/breast/breastOperationsConfig.js
//
// Phase Б.1 — Конфигурация операций.
// Каждый тип имеет параметры, которые отрисовываются в OperationPanel
// автоматически, без хардкода UI на каждый параметр.

export const OPERATION_TYPES = [
  {
    key: "augmentation",
    label: "Аугментация",
    icon: "⊕",
    color: "#3d7fff",
    description: "Увеличение объёма имплантатами",
  },
  {
    key: "reduction",
    label: "Редукция",
    icon: "⊖",
    color: "#f59e0b",
    description: "Уменьшение объёма",
  },
  {
    key: "mastopexy",
    label: "Мастопексия",
    icon: "↑",
    color: "#a855f7",
    description: "Подтяжка груди",
  },
  {
    key: "asymmetry",
    label: "Асимметрия",
    icon: "⇄",
    color: "#06b6d4",
    description: "Коррекция асимметрии",
  },
];

/* ──────────────────────────────────────────────────────────────────────
   Параметры для каждой операции.

   Типы parameter.type:
     • slider     — числовой ползунок с min/max/step/default
     • radio      — выбор одного из вариантов
     • side       — специальный radio для выбора стороны (left/right/both)
     • dual-slider — два слайдера (левая/правая сторона) для асимметрии
   ────────────────────────────────────────────────────────────────────── */

export const OPERATION_PARAMS = {
  augmentation: [
    {
      key: "volume",
      type: "dual-slider",
      label: "Объём имплантата",
      unit: "мл",
      min: 100,
      max: 1000,
      step: 25,
      default: 300,
      presets: [200, 300, 400, 500, 600],
      leftField: "leftVolumeMl",
      rightField: "rightVolumeMl",
    },
    {
      key: "profile",
      type: "radio",
      label: "Профиль имплантата",
      field: "profile",
      default: "moderate",
      options: [
        { value: "low", label: "Низкий" },
        { value: "moderate", label: "Средний" },
        { value: "high", label: "Высокий" },
        { value: "extra-high", label: "Экстра" },
      ],
    },
    {
      key: "position",
      type: "radio",
      label: "Позиция",
      field: "position",
      default: "submuscular",
      options: [
        { value: "subglandular", label: "Над мышцей" },
        { value: "submuscular", label: "Под мышцей" },
        { value: "dual-plane", label: "Dual plane" },
      ],
    },
  ],

  reduction: [
    {
      key: "volume",
      type: "dual-slider",
      label: "Удаляемый объём",
      unit: "мл",
      min: 50,
      max: 1500,
      step: 50,
      default: 300,
      presets: [200, 400, 600, 800],
      leftField: "leftVolumeMl",
      rightField: "rightVolumeMl",
    },
    {
      key: "nippleLift",
      type: "slider",
      label: "Подъём соска",
      unit: "мм",
      min: 0,
      max: 80,
      step: 5,
      default: 30,
      field: "nippleLiftMm",
    },
  ],

  mastopexy: [
    {
      key: "nippleLift",
      type: "slider",
      label: "Подъём соска",
      unit: "мм",
      min: 5,
      max: 60,
      step: 5,
      default: 25,
      field: "nippleLiftMm",
    },
    {
      key: "incisionType",
      type: "radio",
      label: "Тип разреза",
      field: "incisionType",
      default: "vertical",
      options: [
        { value: "circumareolar", label: "Круговой (донат)" },
        { value: "vertical", label: "Вертикальный (леденец)" },
        { value: "wise-pattern", label: "Wise (якорь)" },
      ],
    },
    {
      key: "side",
      type: "side",
      label: "Сторона",
      field: "side",
      default: "both",
    },
  ],

  asymmetry: [
    {
      key: "targetSide",
      type: "radio",
      label: "Корректируемая сторона",
      field: "targetSide",
      default: "left",
      options: [
        { value: "left", label: "Левая" },
        { value: "right", label: "Правая" },
      ],
    },
    {
      key: "correctionType",
      type: "radio",
      label: "Тип коррекции",
      field: "correctionType",
      default: "augment",
      options: [
        { value: "augment", label: "Увеличение" },
        { value: "reduce", label: "Уменьшение" },
      ],
    },
    {
      key: "volume",
      type: "slider",
      label: "Изменение объёма",
      unit: "мл",
      min: 25,
      max: 500,
      step: 25,
      default: 100,
      field: "volumeMl",
    },
    {
      key: "nippleLift",
      type: "slider",
      label: "Подъём соска",
      unit: "мм",
      min: 0,
      max: 40,
      step: 5,
      default: 0,
      field: "nippleLiftMm",
    },
  ],
};

/**
 * Возвращает default параметры для типа операции.
 */
export function getDefaultOperationParams(type) {
  if (!type || !OPERATION_PARAMS[type]) return {};
  const params = {};

  for (const def of OPERATION_PARAMS[type]) {
    if (def.type === "dual-slider") {
      params[def.leftField] = def.default;
      params[def.rightField] = def.default;
    } else if (def.type === "side") {
      params[def.field] = def.default;
    } else {
      params[def.field] = def.default;
    }
  }

  return params;
}

/**
 * Краткое текстовое описание операции для бейджа в списке планов и т.д.
 */
export function describeOperation(operation) {
  if (!operation || !operation.type) return null;

  const typeInfo = OPERATION_TYPES.find((t) => t.key === operation.type);
  const params = operation.params || {};

  if (operation.type === "augmentation") {
    const left = params.leftVolumeMl || 0;
    const right = params.rightVolumeMl || 0;
    if (left === right) {
      return `${typeInfo.label} · ${left} мл`;
    }
    return `${typeInfo.label} · L${left}/R${right} мл`;
  }

  if (operation.type === "reduction") {
    const left = params.leftVolumeMl || 0;
    const right = params.rightVolumeMl || 0;
    return `${typeInfo.label} · −${(left + right) / 2} мл`;
  }

  if (operation.type === "mastopexy") {
    return `${typeInfo.label} · +${params.nippleLiftMm || 0} мм`;
  }

  if (operation.type === "asymmetry") {
    const sign = params.correctionType === "augment" ? "+" : "−";
    const side = params.targetSide === "left" ? "L" : "R";
    return `${typeInfo.label} · ${side}${sign}${params.volumeMl || 0} мл`;
  }

  return typeInfo.label;
}
