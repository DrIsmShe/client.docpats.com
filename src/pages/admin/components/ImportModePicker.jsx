// client/src/pages/admin/components/ImportModePicker.jsx
//
// Выбор режима загрузки. Вынесен отдельно, потому что нужен и на странице
// базы, и на странице коллекции, а разъехавшиеся описания режимов — прямой
// путь к тому, что администратор нажмёт «заменить», думая, что «дополнит».
//
// Разрушительный режим требует явного подтверждения: набрать имя базы или
// коллекции руками. Это не формальность — «заменить» удаляет всё, что
// появилось после выгрузки, и отменить это нечем.

import { IMPORT_MODES } from "../../../api/adminTransfer";

export default function ImportModePicker({ mode, onMode, confirmWord, confirm, onConfirm }) {
  const selected = IMPORT_MODES.find((m) => m.value === mode) || IMPORT_MODES[0];

  return (
    <div className="mb-3">
      <label className="form-label small text-muted">Что делать с данными</label>

      {IMPORT_MODES.map((m) => (
        <div className="form-check" key={m.value}>
          <input
            className="form-check-input"
            type="radio"
            id={`mode-${m.value}`}
            checked={mode === m.value}
            onChange={() => onMode(m.value)}
          />
          <label
            className={`form-check-label${m.danger ? " text-danger" : ""}`}
            htmlFor={`mode-${m.value}`}
          >
            <b>{m.title}</b>
            <div className="small text-muted">{m.hint}</div>
          </label>
        </div>
      ))}

      {selected.danger && (
        <div className="alert alert-danger mt-3 py-2">
          <div className="small">
            Будут <b>удалены</b> все записи в коллекциях, перечисленных в файле,
            включая созданные после выгрузки. Отменить это нельзя.
          </div>
          <div className="small mt-2">
            Для подтверждения наберите <code>{confirmWord}</code>:
          </div>
          <input
            className="form-control form-control-sm mt-1"
            value={confirm}
            onChange={(e) => onConfirm(e.target.value)}
            placeholder={confirmWord}
          />
        </div>
      )}
    </div>
  );
}

/** Можно ли запускать: разрушительный режим — только с точным подтверждением. */
export function modeReady(mode, confirmWord, confirm) {
  const selected = IMPORT_MODES.find((m) => m.value === mode);
  if (!selected?.danger) return true;
  return confirm.trim() === confirmWord;
}
