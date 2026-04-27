// ─── Схемы операций с поддержкой i18n ──────────────────────────────────
// getSchema(procedure, t) возвращает schema с уже переведёнными строками.
// Переводы хранятся в locales/{lang}/Surgery.json → planSchema.{...}
//
// Формат полей остаётся прежним: { key, label, type, placeholder?, options? }.
// options — массив локализованных строк (как раньше).
// SurgeryPlanForm.jsx не требует изменений по логике, только getSchema(cas.procedure, t).

// Хелпер для чтения массива options из i18n (возвращает массив строк)
const arr = (t, k) => {
  const v = t(k, { returnObjects: true });
  return Array.isArray(v) ? v : [];
};

// ─── Универсальные конструкторы полей ──────────────────────────────────
const mkField = (key, type, t, base, extra = {}) => {
  const o = { key, type, label: t(`${base}.${key}.label`) };
  const ph = t(`${base}.${key}.placeholder`, { defaultValue: "" });
  if (ph) o.placeholder = ph;
  const opts = arr(t, `${base}.${key}.options`);
  if (opts.length) o.options = opts;
  return { ...o, ...extra };
};

// Построитель секции: { title, icon, fields } из i18n
// fieldSpecs — массив [key, type] или [{ key, type, ...override }]
const mkSection = (t, base, icon, fieldSpecs) => ({
  title: t(`${base}.title`),
  icon,
  fields: fieldSpecs.map((spec) => {
    if (Array.isArray(spec)) {
      const [key, type] = spec;
      return mkField(key, type, t, `${base}.fields`);
    }
    return mkField(spec.key, spec.type, t, `${base}.fields`, spec);
  }),
});

// ─── Общие секции (consultation, preop_tests, risks_consent, postop_plan) ───
function commonSections(t) {
  return {
    consultation: mkSection(t, "planSchema.common.consultation", "🗣️", [
      ["motivation", "textarea"],
      ["complaints", "textarea"],
      ["anamnesis", "textarea"],
      ["medications", "textarea"],
      ["allergies", "text"],
      ["smoking", "select"],
      ["alcohol", "select"],
      ["previousSurgeries", "textarea"],
    ]),
    preop_tests: mkSection(t, "planSchema.common.preop_tests", "🔬", [
      ["tests", "checklist"],
      ["contraindications", "textarea"],
      ["anesthesia", "select"],
    ]),
    risks_consent: mkSection(t, "planSchema.common.risks_consent", "⚠️", [
      ["risks_discussed", "checklist"],
      ["consent_given", "checkbox"],
      ["consent_date", "text"],
      ["consent_notes", "textarea"],
    ]),
    postop_plan: mkSection(t, "planSchema.common.postop_plan", "📋", [
      ["compression", "text"],
      ["activity", "textarea"],
      ["antibiotics", "textarea"],
      ["pain_management", "textarea"],
      ["followup_schedule", "textarea"],
      ["drain", "select"],
      ["special_instructions", "textarea"],
    ]),
  };
}

// ─── Shared-поля (нужны в plan-секции многих процедур) ──────────────────
function sharedFields(t) {
  return {
    duration_min: {
      key: "duration_min",
      type: "number",
      label: t("planSchema.shared.duration_min.label"),
      placeholder: t("planSchema.shared.duration_min.placeholder"),
    },
    surgeon_notes: {
      key: "surgeon_notes",
      type: "textarea",
      label: t("planSchema.shared.surgeon_notes.label"),
      placeholder: t("planSchema.shared.surgeon_notes.placeholder"),
    },
  };
}

// ═══ getSchema ═══════════════════════════════════════════════════════════
export function getSchema(procedure, t) {
  // Fallback — если t не передан (на старых вызовах), чтобы не ломалось
  if (typeof t !== "function") {
    console.warn(
      "[PLAN_SCHEMAS] getSchema called without t() — returning empty schema",
    );
    return { label: procedure, sections: [] };
  }

  const common = commonSections(t);
  const shared = sharedFields(t);

  const schemas = {
    rhinoplasty: {
      label: t(`procedures.${procedure}`, procedure),
      sections: [
        common.consultation,
        mkSection(t, "planSchema.rhinoplasty.examination", "📐", [
          ["skin_type", "select"],
          ["nasal_tip", "select"],
          ["nasal_bridge", "select"],
          ["septum", "select"],
          ["nasal_base_width", "number"],
          ["tip_projection", "select"],
          ["nasofrontal_angle", "number"],
          ["nasolabial_angle", "number"],
          ["asymmetry", "textarea"],
          ["breathing", "select"],
        ]),
        {
          ...mkSection(t, "planSchema.rhinoplasty.plan", "⚙️", [
            ["approach", "radio"],
            ["osteotomy", "checklist"],
            ["tip_technique", "checklist"],
            ["graft_material", "select"],
            ["septoplasty", "checkbox"],
            ["turbinoplasty", "checkbox"],
          ]),
          // Добавляем shared поля в конце plan-секции
          fields: [
            ...mkSection(t, "planSchema.rhinoplasty.plan", "⚙️", [
              ["approach", "radio"],
              ["osteotomy", "checklist"],
              ["tip_technique", "checklist"],
              ["graft_material", "select"],
              ["septoplasty", "checkbox"],
              ["turbinoplasty", "checkbox"],
            ]).fields,
            shared.duration_min,
            shared.surgeon_notes,
          ],
        },
        common.preop_tests,
        common.risks_consent,
        common.postop_plan,
      ],
    },

    breast_augmentation: {
      label: t(`procedures.${procedure}`, procedure),
      sections: [
        common.consultation,
        mkSection(t, "planSchema.breast_augmentation.examination", "📐", [
          ["current_size", "text"],
          ["desired_size", "text"],
          ["breast_base_width", "number"],
          ["skin_thickness", "number"],
          ["ptosis_degree", "select"],
          ["nipple_position", "select"],
          ["asymmetry", "textarea"],
          ["skin_quality", "select"],
          ["lactation_history", "select"],
        ]),
        mkSection(t, "planSchema.breast_augmentation.implant", "🔩", [
          ["implant_shape", "radio"],
          ["implant_profile", "radio"],
          ["implant_volume_l", "number"],
          ["implant_volume_r", "number"],
          ["implant_fill", "radio"],
          ["implant_surface", "radio"],
          ["implant_brand", "text"],
          ["sizer_used", "checkbox"],
        ]),
        {
          ...mkSection(t, "planSchema.breast_augmentation.plan", "⚙️", [
            ["access", "radio"],
            ["pocket", "radio"],
            ["mastopexy_planned", "checkbox"],
          ]),
          fields: [
            ...mkSection(t, "planSchema.breast_augmentation.plan", "⚙️", [
              ["access", "radio"],
              ["pocket", "radio"],
              ["mastopexy_planned", "checkbox"],
            ]).fields,
            shared.duration_min,
            shared.surgeon_notes,
          ],
        },
        mkSection(t, "planSchema.breast_augmentation.specific_risks", "⚠️", [
          ["specific_risks", "checklist"],
        ]),
        common.preop_tests,
        common.risks_consent,
        common.postop_plan,
      ],
    },

    breast_reduction: {
      label: t(`procedures.${procedure}`, procedure),
      sections: [
        common.consultation,
        mkSection(t, "planSchema.breast_reduction.examination", "📐", [
          ["current_size", "text"],
          ["desired_size", "text"],
          ["breast_weight_l", "number"],
          ["breast_weight_r", "number"],
          ["ptosis_degree", "select"],
          ["nipple_to_fold", "number"],
          ["sternal_notch_nipple", "number"],
          ["symptoms", "checklist"],
        ]),
        {
          ...mkSection(t, "planSchema.breast_reduction.plan", "⚙️", [
            ["technique", "radio"],
            ["resection_volume_l", "number"],
            ["resection_volume_r", "number"],
            ["new_nipple_position", "text"],
            ["liposuction_planned", "checkbox"],
          ]),
          fields: [
            ...mkSection(t, "planSchema.breast_reduction.plan", "⚙️", [
              ["technique", "radio"],
              ["resection_volume_l", "number"],
              ["resection_volume_r", "number"],
              ["new_nipple_position", "text"],
              ["liposuction_planned", "checkbox"],
            ]).fields,
            shared.duration_min,
            shared.surgeon_notes,
          ],
        },
        common.preop_tests,
        common.risks_consent,
        common.postop_plan,
      ],
    },

    blepharoplasty: {
      label: t(`procedures.${procedure}`, procedure),
      sections: [
        common.consultation,
        mkSection(t, "planSchema.blepharoplasty.examination", "📐", [
          ["type", "checklist"],
          ["upper_excess_skin", "number"],
          ["ptosis_upper", "select"],
          ["fat_herniation_upper", "checklist"],
          ["fat_herniation_lower", "checklist"],
          ["tear_trough", "select"],
          ["lower_skin_excess", "number"],
          ["canthal_laxity", "select"],
          ["dry_eye", "select"],
          ["schirmer_test", "text"],
        ]),
        {
          ...mkSection(t, "planSchema.blepharoplasty.plan", "⚙️", [
            ["upper_skin_resection", "number"],
            ["upper_fat_removal", "checklist"],
            ["lower_approach", "radio"],
            ["lower_fat_management", "radio"],
            ["canthopexy", "checkbox"],
            ["asian_technique", "checkbox"],
          ]),
          fields: [
            ...mkSection(t, "planSchema.blepharoplasty.plan", "⚙️", [
              ["upper_skin_resection", "number"],
              ["upper_fat_removal", "checklist"],
              ["lower_approach", "radio"],
              ["lower_fat_management", "radio"],
              ["canthopexy", "checkbox"],
              ["asian_technique", "checkbox"],
            ]).fields,
            shared.duration_min,
            shared.surgeon_notes,
          ],
        },
        common.preop_tests,
        common.risks_consent,
        common.postop_plan,
      ],
    },

    liposuction: {
      label: t(`procedures.${procedure}`, procedure),
      sections: [
        common.consultation,
        mkSection(t, "planSchema.liposuction.examination", "📐", [
          ["bmi", "number"],
          ["weight", "number"],
          ["target_zones", "checklist"],
          ["skin_elasticity", "select"],
          ["cellulite", "select"],
          ["stretch_marks", "select"],
        ]),
        {
          ...mkSection(t, "planSchema.liposuction.plan", "⚙️", [
            ["technique", "radio"],
            ["tumescent_volume", "number"],
            ["expected_aspirate", "number"],
            ["cannula_size", "text"],
            ["skin_excision", "checkbox"],
          ]),
          fields: [
            ...mkSection(t, "planSchema.liposuction.plan", "⚙️", [
              ["technique", "radio"],
              ["tumescent_volume", "number"],
              ["expected_aspirate", "number"],
              ["cannula_size", "text"],
              ["skin_excision", "checkbox"],
            ]).fields,
            shared.duration_min,
            shared.surgeon_notes,
          ],
        },
        common.preop_tests,
        common.risks_consent,
        common.postop_plan,
      ],
    },

    abdominoplasty: {
      label: t(`procedures.${procedure}`, procedure),
      sections: [
        common.consultation,
        mkSection(t, "planSchema.abdominoplasty.examination", "📐", [
          ["type", "radio"],
          ["diastasis_width", "number"],
          ["diastasis_length", "select"],
          ["skin_excess", "select"],
          ["hernia", "select"],
          ["previous_scars", "textarea"],
          ["bmi", "number"],
        ]),
        {
          ...mkSection(t, "planSchema.abdominoplasty.plan", "⚙️", [
            ["incision_level", "text"],
            ["neoumbilicoplasty", "checkbox"],
            ["diastasis_repair", "checkbox"],
            ["liposuction_zones", "checklist"],
            ["drain_count", "select"],
          ]),
          fields: [
            ...mkSection(t, "planSchema.abdominoplasty.plan", "⚙️", [
              ["incision_level", "text"],
              ["neoumbilicoplasty", "checkbox"],
              ["diastasis_repair", "checkbox"],
              ["liposuction_zones", "checklist"],
              ["drain_count", "select"],
            ]).fields,
            shared.duration_min,
            shared.surgeon_notes,
          ],
        },
        mkSection(t, "planSchema.abdominoplasty.specific_risks", "⚠️", [
          ["specific_risks", "checklist"],
        ]),
        common.preop_tests,
        common.risks_consent,
        common.postop_plan,
      ],
    },

    facelift: {
      label: t(`procedures.${procedure}`, procedure),
      sections: [
        common.consultation,
        mkSection(t, "planSchema.facelift.examination", "📐", [
          ["age", "number"],
          ["skin_quality", "select"],
          ["jowls", "select"],
          ["nasolabial_folds", "select"],
          ["neck_laxity", "select"],
          ["platysmal_bands", "select"],
          ["fat_distribution", "textarea"],
          ["facial_asymmetry", "textarea"],
          ["hair_line", "select"],
        ]),
        {
          ...mkSection(t, "planSchema.facelift.plan", "⚙️", [
            ["technique", "radio"],
            ["neck_lift", "checkbox"],
            ["platysmaplasty", "checkbox"],
            ["brow_lift", "checkbox"],
            ["fat_grafting", "checkbox"],
            ["fat_grafting_zones", "textarea"],
            ["liposuction", "checkbox"],
            ["incision_type", "select"],
          ]),
          fields: [
            ...mkSection(t, "planSchema.facelift.plan", "⚙️", [
              ["technique", "radio"],
              ["neck_lift", "checkbox"],
              ["platysmaplasty", "checkbox"],
              ["brow_lift", "checkbox"],
              ["fat_grafting", "checkbox"],
              ["fat_grafting_zones", "textarea"],
              ["liposuction", "checkbox"],
              ["incision_type", "select"],
            ]).fields,
            shared.duration_min,
            shared.surgeon_notes,
          ],
        },
        common.preop_tests,
        common.risks_consent,
        common.postop_plan,
      ],
    },

    otoplasty: {
      label: t(`procedures.${procedure}`, procedure),
      sections: [
        common.consultation,
        mkSection(t, "planSchema.otoplasty.examination", "📐", [
          ["protrusion_l", "number"],
          ["protrusion_r", "number"],
          ["distance_scalp_l", "number"],
          ["distance_scalp_r", "number"],
          ["antihelix", "select"],
          ["conchal_excess", "select"],
          ["earlobe", "select"],
          ["asymmetry", "textarea"],
        ]),
        {
          ...mkSection(t, "planSchema.otoplasty.plan", "⚙️", [
            ["technique", "radio"],
            ["conchal_setback", "checkbox"],
            ["skin_excision", "checkbox"],
            ["earlobe_correction", "checkbox"],
            ["bilateral", "checkbox"],
          ]),
          fields: [
            ...mkSection(t, "planSchema.otoplasty.plan", "⚙️", [
              ["technique", "radio"],
              ["conchal_setback", "checkbox"],
              ["skin_excision", "checkbox"],
              ["earlobe_correction", "checkbox"],
              ["bilateral", "checkbox"],
            ]).fields,
            shared.duration_min,
            shared.surgeon_notes,
          ],
        },
        common.preop_tests,
        common.risks_consent,
        common.postop_plan,
      ],
    },

    chin_implant: {
      label: t(`procedures.${procedure}`, procedure),
      sections: [
        common.consultation,
        mkSection(t, "planSchema.chin_implant.examination", "📐", [
          ["chin_projection", "select"],
          ["chin_projection_mm", "number"],
          ["facial_thirds", "textarea"],
          ["occlusion", "select"],
          ["orthodontics", "select"],
          ["neck_jaw_angle", "select"],
        ]),
        {
          ...mkSection(t, "planSchema.chin_implant.plan", "⚙️", [
            ["implant_size", "text"],
            ["implant_type", "radio"],
            ["access", "radio"],
            ["liposuction", "checkbox"],
            ["platysmaplasty", "checkbox"],
          ]),
          fields: [
            ...mkSection(t, "planSchema.chin_implant.plan", "⚙️", [
              ["implant_size", "text"],
              ["implant_type", "radio"],
              ["access", "radio"],
              ["liposuction", "checkbox"],
              ["platysmaplasty", "checkbox"],
            ]).fields,
            shared.duration_min,
            shared.surgeon_notes,
          ],
        },
        common.preop_tests,
        common.risks_consent,
        common.postop_plan,
      ],
    },

    lip_augmentation: {
      label: t(`procedures.${procedure}`, procedure),
      sections: [
        common.consultation,
        mkSection(t, "planSchema.lip_augmentation.examination", "📐", [
          ["upper_lip_height", "number"],
          ["lower_lip_volume", "select"],
          ["lip_ratio", "text"],
          ["cupid_bow", "select"],
          ["philtrum", "select"],
          ["previous_fillers", "textarea"],
          ["asymmetry", "textarea"],
        ]),
        mkSection(t, "planSchema.lip_augmentation.plan", "⚙️", [
          ["technique", "radio"],
          ["filler_brand", "text"],
          ["volume_upper_ml", "number"],
          ["volume_lower_ml", "number"],
          ["volume_total_ml", "number"],
          ["cannula_needle", "radio"],
          ["zones", "checklist"],
          // для lip_augmentation нужны только surgeon_notes, не duration
        ]).concat
          ? null
          : null, // placeholder to keep structure
        common.risks_consent,
        mkSection(t, "planSchema.lip_augmentation.postop_specific", "📋", [
          ["ice_application", "checkbox"],
          ["avoid_heat", "checkbox"],
          ["followup_days", "number"],
          ["special_instructions", "textarea"],
        ]),
      ].filter(Boolean),
    },

    other: {
      label: t(`procedures.${procedure}`, procedure),
      sections: [
        common.consultation,
        mkSection(t, "planSchema.other.examination", "📐", [
          ["exam_notes", "textarea"],
          ["measurements", "textarea"],
        ]),
        {
          ...mkSection(t, "planSchema.other.plan", "⚙️", [
            ["technique", "textarea"],
          ]),
          fields: [
            ...mkSection(t, "planSchema.other.plan", "⚙️", [
              ["technique", "textarea"],
            ]).fields,
            shared.duration_min,
            shared.surgeon_notes,
          ],
        },
        common.preop_tests,
        common.risks_consent,
        common.postop_plan,
      ],
    },
  };

  // Spread fields in lip_augmentation properly (filter above returned null for placeholder)
  if (procedure === "lip_augmentation") {
    return {
      label: t(`procedures.${procedure}`, procedure),
      sections: [
        common.consultation,
        mkSection(t, "planSchema.lip_augmentation.examination", "📐", [
          ["upper_lip_height", "number"],
          ["lower_lip_volume", "select"],
          ["lip_ratio", "text"],
          ["cupid_bow", "select"],
          ["philtrum", "select"],
          ["previous_fillers", "textarea"],
          ["asymmetry", "textarea"],
        ]),
        {
          ...mkSection(t, "planSchema.lip_augmentation.plan", "⚙️", [
            ["technique", "radio"],
            ["filler_brand", "text"],
            ["volume_upper_ml", "number"],
            ["volume_lower_ml", "number"],
            ["volume_total_ml", "number"],
            ["cannula_needle", "radio"],
            ["zones", "checklist"],
          ]),
          fields: [
            ...mkSection(t, "planSchema.lip_augmentation.plan", "⚙️", [
              ["technique", "radio"],
              ["filler_brand", "text"],
              ["volume_upper_ml", "number"],
              ["volume_lower_ml", "number"],
              ["volume_total_ml", "number"],
              ["cannula_needle", "radio"],
              ["zones", "checklist"],
            ]).fields,
            shared.surgeon_notes,
          ],
        },
        common.risks_consent,
        mkSection(t, "planSchema.lip_augmentation.postop_specific", "📋", [
          ["ice_application", "checkbox"],
          ["avoid_heat", "checkbox"],
          ["followup_days", "number"],
          ["special_instructions", "textarea"],
        ]),
      ],
    };
  }

  return schemas[procedure] || schemas.other;
}
