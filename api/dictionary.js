export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { word } = req.query;

  if (!word) {
    return res.status(200).json({ error: 'dictionary_unavailable' });
  }

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.trim())}`
    );

    if (response.status === 404) {
      return res.status(200).json({ error: 'not_found' });
    }

    if (!response.ok) {
      console.error(`Dictionary API HTTP ${response.status}`);
      return res.status(200).json({ error: 'dictionary_unavailable' });
    }

    const json = await response.json();
    const entry = json[0];

    if (!entry) {
      return res.status(200).json({ error: 'not_found' });
    }

    // phonetic: top-level field first, then first phonetics entry with non-empty text
    let phonetic = entry.phonetic || null;
    if (!phonetic) {
      const found = (entry.phonetics || []).find((p) => p.text);
      phonetic = found?.text || null;
    }

    // audio: first phonetics entry with a non-empty audio URL
    const audioEntry = (entry.phonetics || []).find((p) => p.audio);
    const audio = audioEntry?.audio || null;

    const meanings = (entry.meanings || []).slice(0, 3).map((m) => ({
      partOfSpeech: m.partOfSpeech,
      definitions: (m.definitions || []).slice(0, 3).map((d) => {
        const def = { definition: d.definition };
        if (d.example) def.example = d.example;
        return def;
      }),
    }));

    return res.status(200).json({ word: entry.word, phonetic, audio, meanings });
  } catch (err) {
    console.error(`Dictionary request failed: ${err.message}`);
    return res.status(200).json({ error: 'dictionary_unavailable' });
  }
}
