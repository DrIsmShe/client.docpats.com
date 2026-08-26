// client/src/pages/admin/radiology/agentRun.js
//
// ОЖИДАНИЕ ФОНОВОГО ПРОГОНА АГЕНТА — общее для трёх админок арены.
//
// Прогон делает до пятнадцати вызовов Opus подряд: цикл «правка →
// перепроверка», разбор судьёй, точечные правки, перевод после публикации. В
// HTTP-запрос это не влезает ни при каком таймауте — nginx рвёт соединение на
// 240 с, а сервер спокойно досчитывает и публикует кейс, о котором автору уже
// сказали «Network Error». Мы чинили это дважды и оба раза лечили симптом.
//
// Теперь запуск только СТАВИТ задачу, а результат забирается опросом того же
// GET, которым админка и так перечитывает кейс: состояние прогона лежит в нём
// самом (server/.../ai/agentRunFields.js). Ни нового маршрута, ни новой
// модели, ни очереди — прогон запускает человек по одному кейсу за раз,
// глядя на экран.

// Как часто спрашиваем. Прогон идёт минутами, поэтому секундный опрос — это
// сотня лишних запросов ради одного ответа; три секунды человек не замечает.
const POLL_MS = 3000;

// Когда сдаёмся. Дольше этого прогон живым не бывает даже на самом упрямом
// кейсе, а вечный опрос держал бы кнопку заблокированной после рестарта
// сервера: фоновая работа живёт в памяти узла и рестарт её не переживает.
const GIVE_UP_MS = 15 * 60 * 1000;

/**
 * Дождаться конца фонового прогона.
 *
 * @param {object} p
 * @param {() => Promise<object>} p.fetchCase   перечитать кейс с сервера
 * @param {(doc: object) => void} [p.onTick]    вызывается на каждом опросе —
 *        сюда удобно отдавать свежий кейс, чтобы форма обновлялась по ходу
 * @param {() => boolean} [p.cancelled]         прервать опрос (ушли со страницы)
 * @returns {Promise<{report: object|null, error: string|null, timedOut: boolean}>}
 */
export async function waitForAgentRun({ fetchCase, onTick, cancelled }) {
  const startedAt = Date.now();

  for (;;) {
    if (cancelled?.()) return { report: null, error: null, timedOut: false };

    const doc = await fetchCase();
    onTick?.(doc);

    const run = doc?.agentRun;
    // Записи нет вовсе — сервер старый либо прогон не стартовал. Молча ждать
    // в этом случае хуже, чем честно вернуться ни с чем.
    if (!run || run.status === "idle") {
      return { report: null, error: null, timedOut: false };
    }
    if (run.status === "done") {
      return { report: run.report ?? null, error: null, timedOut: false };
    }
    if (run.status === "failed") {
      return { report: run.report ?? null, error: run.error ?? "", timedOut: false };
    }

    if (Date.now() - startedAt > GIVE_UP_MS) {
      return { report: null, error: null, timedOut: true };
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
}

export const AGENT_TIMED_OUT_NOTICE =
  "Агент работает дольше обычного. Он не остановлен — прогон продолжается на " +
  "сервере. Откройте кейс заново через несколько минут: правки, публикация и " +
  "перевод применятся сами.";
