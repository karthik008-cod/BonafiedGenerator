export default async function handler(req, res) {
  // Get token from Authorization header
  const token = req.headers.authorization;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!token || token !== sessionSecret) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  const { adm } = req.query;
  if (!adm) {
    return res.status(400).json({ error: 'Admission number is required.' });
  }

  // Hide the SHEET_ID in the backend
  const sheetId = process.env.SHEET_ID || "1saM9Tj4N4VrlRR0gtrYOiM4F5iqHvFVRmKik1bbi_DM";
  const sheetName = "DATA";

  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to retrieve database from Google Sheets.' });
    }
    const text = await response.text();
    const rows = parseCSV(text);

    if (rows.length < 2) {
      return res.status(500).json({ error: 'Empty or invalid spreadsheet data.' });
    }

    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const admCol = headers.findIndex(
      (h) =>
        h === "admn no." ||
        h === "adm_no" ||
        h === "admission no" ||
        h === "admno" ||
        h.startsWith("adm")
    );

    if (admCol === -1) {
      return res.status(500).json({ error: 'Admission number column not found in spreadsheet.' });
    }

    const searchAdm = adm.trim();
    const studentRow = rows
      .slice(1)
      .find((r) => r[admCol] && r[admCol].trim() === searchAdm);

    if (!studentRow) {
      return res.status(404).json({ error: `No student found with Adm No. ${searchAdm}.` });
    }

    // Return only the specific student row and headers
    return res.status(200).json({
      success: true,
      studentRow,
      headers
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

function parseCSV(text) {
  const rows = [];
  const lines = text.split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    const cells = [];
    let cur = "",
      inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQ = !inQ;
      } else if (ch === "," && !inQ) {
        cells.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur);
    rows.push(cells);
  }
  return rows;
}
