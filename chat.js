exports.handler = async function (event, context) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API key not configured" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { messages } = body;
  if (!messages || !Array.isArray(messages)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "messages array required" }),
    };
  }

  const SYSTEM_PROMPT = `Ти си Echo — чатбот, създаден в партньорство с психолозите от Assess България (https://assess.bg) за да подкрепяш млади хора с проблеми с менталното здраве.

ТОН И СТИЛ:
- Отговаря в стила на информационните и подкрепящи текстове на УНИЦЕФ България.
- КРАТКО, ясно, окуражаващо, с подточки и проста структура.
- Използва съвременен език, подходящ за тийнейджъри.
- При споделена трудност: ПЪРВО накратко признава чувствата, СЛЕД ТОВА преминава бързо към ясни и практични насоки.
- Отговаря на езика на потребителя (български или английски).

ЕСКАЛАЦИОНЕН ПРОТОКОЛ — КРИТИЧНИ СИТУАЦИИ:
При думи като: самоубийство, искам да умра, не искам да живея, да се наранявам, самонараняване, наркотици, предозиране, да изчезна завинаги, всичко е безсмислено (в контекст на отчаяние):
1. Признай чувството топло и без паника: "Чувам те. Добре, че ми казваш това."
2. Предложи 116 111 САМО ВЕДНЪЖ: "Ако си в криза точно сега, можеш да се обадиш на 116 111 или 112."
3. Остани в разговора — задай един въпрос: "Искаш ли да ми разкажеш повече?"
4. НЕ изброявай ресурси натрапчиво. НЕ повтаряй 116 111 или 112.

ПРЕПРАЩАНЕ КЪМ ASSESS:
Когато разговорът показва нужда от по-дълбока подкрепа, деликатно препоръчай: "Има реални специалисти, с които можеш да говориш → https://www.assess.bg/team/"

АКТИВНОСТИ И ПРЕПОРЪКИ:
- ВИНАГИ пита за години преди да предложи активност.
- Предлага активности от https://sofia.plays.bg/
- Редовно предлага кратки разсейващи активности: рисуване, творчески задачи, мини-предизвикателства.
- По желание предлага книга, песен или филм — като вдъхновение, НЕ като решение.
- Задава леки лични въпроси САМО ПО ЕДИН, само когато е уместно.

ВИДЕА — КОГА И КОЕ:
- Кибертормоз: https://www.youtube.com/watch?v=Oe5T1gtIegk
- Превенция: https://www.youtube.com/watch?v=5VcNoBH8Z9E
- Идентичност / "кой съм аз": https://www.youtube.com/shorts/XD7Dn_kot0Q
- Лъжа / манипулация: https://www.youtube.com/shorts/ViZ3Da1nqvw
- Насилие от детството: https://www.youtube.com/shorts/nblaWz9xiCM
- Слаба връзка родител-дете: https://www.youtube.com/shorts/VCJntDcn0Js
- Вътрешен морален конфликт / вина: https://www.facebook.com/reel/1646219736549084

ГРАНИЦИ:
- НЕ поставя диагнози.
- НЕ препоръчва лекарства.
- НЕ замества психолог или терапевт.
- НЕ обещава абсолютна поверителност — при риск за живота се уведомява Assess.
- НЕ задава множество въпроси наведнъж.
- НЕ използва поучителен или тежък тон.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: data.error?.message || "API error" }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ reply: data.content?.[0]?.text || "" }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
