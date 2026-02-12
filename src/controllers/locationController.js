import pool from "../config/database.js";
import puppeteer from "puppeteer";

function rowToLocation(row) {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    city: row.city ?? "",
    cleaned: row.cleaned ?? false,
    coffeeDelivered: row.coffee_delivered ?? false,
    reminders: row.reminders ?? "",
    completed: row.completed ?? false,
    ownerAcceptance: row.owner_acceptance ?? undefined,
    coffeePriceKg:
      row.coffee_price_kg !== null && row.coffee_price_kg !== undefined
        ? Number(row.coffee_price_kg)
        : null,
    coffeeType: row.coffee_type ?? null,
    phone: row.phone ?? null,
  };
}

export const getAllLocations = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM locations ORDER BY city, name",
    );
    res.json(result.rows.map(rowToLocation));
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLocationById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM locations WHERE id = $1", [
      id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Location not found" });
    }
    res.json(rowToLocation(result.rows[0]));
  } catch (error) {
    console.error("Error fetching location:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createLocation = async (req, res) => {
  try {
    const { name, location, city, coffeePriceKg, coffeeType, phone } = req.body;
    if (!name || !location) {
      return res.status(400).json({ error: "name and location are required" });
    }
    const id = `loc-${Date.now()}`;
    await pool.query(
      `INSERT INTO locations (
         id, name, location, city,
         cleaned, coffee_delivered, reminders, completed,
         coffee_price_kg, coffee_type, phone
       )
       VALUES ($1, $2, $3, $4, false, false, '', false, $5, $6, $7)`,
      [
        id,
        name,
        location,
        (city ?? "").trim(),
        coffeePriceKg ?? null,
        coffeeType ?? null,
        phone ?? null,
      ],
    );
    const result = await pool.query("SELECT * FROM locations WHERE id = $1", [
      id,
    ]);
    res.status(201).json(rowToLocation(result.rows[0]));
  } catch (error) {
    console.error("Error creating location:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      location,
      city,
      cleaned,
      coffeeDelivered,
      reminders,
      completed,
      ownerAcceptance,
      coffeePriceKg,
      coffeeType,
      phone,
    } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (location !== undefined) {
      updates.push(`location = $${paramCount++}`);
      values.push(location);
    }
    if (city !== undefined) {
      updates.push(`city = $${paramCount++}`);
      values.push(city);
    }
    if (cleaned !== undefined) {
      updates.push(`cleaned = $${paramCount++}`);
      values.push(cleaned);
    }
    if (coffeeDelivered !== undefined) {
      updates.push(`coffee_delivered = $${paramCount++}`);
      values.push(coffeeDelivered);
    }
    if (reminders !== undefined) {
      updates.push(`reminders = $${paramCount++}`);
      values.push(reminders);
    }
    if (completed !== undefined) {
      updates.push(`completed = $${paramCount++}`);
      values.push(completed);
    }
    if (ownerAcceptance !== undefined) {
      updates.push(`owner_acceptance = $${paramCount++}`);
      values.push(JSON.stringify(ownerAcceptance));
    }
    if (coffeePriceKg !== undefined) {
      updates.push(`coffee_price_kg = $${paramCount++}`);
      values.push(coffeePriceKg);
    }
    if (coffeeType !== undefined) {
      updates.push(`coffee_type = $${paramCount++}`);
      values.push(coffeeType);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE locations SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Location not found" });
    }

    res.json(rowToLocation(result.rows[0]));
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM locations WHERE id = $1 RETURNING id",
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Location not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting location:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const resetLocations = async (req, res) => {
  try {
    // Reset only task-related fields; keep cafe info, coffee config, and phone
    await pool.query(
      `UPDATE locations
       SET cleaned = false,
           coffee_delivered = false,
           reminders = '',
           completed = false,
           owner_acceptance = NULL,
           updated_at = CURRENT_TIMESTAMP`,
    );

    const result = await pool.query(
      "SELECT * FROM locations ORDER BY city, name",
    );
    res.json(result.rows.map(rowToLocation));
  } catch (error) {
    console.error("Error resetting locations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const exportReportPdf = async (req, res) => {
  let browser;
  try {
    // Fetch all locations from the database
    const result = await pool.query(
      "SELECT * FROM locations ORDER BY city, name",
    );
    const locations = result.rows.map(rowToLocation);

    // Calculate current week range (Monday - Sunday)
    const today = new Date();
    const day = today.getDay(); // 0 (Sun) - 6 (Sat)
    const diffToMonday = (day + 6) % 7; // convert to 0 (Mon) - 6 (Sun)
    const monday = new Date(today);
    monday.setDate(today.getDate() - diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const mondayStr = monday.toLocaleDateString("en-GB");
    const sundayStr = sunday.toLocaleDateString("en-GB");

    // Generate HTML content for the report
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Raporti i pastrimit të aparateve të kafesë</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
            }
            h1 { 
              text-align: center; 
              margin-bottom: 4px; 
              font-size: 20px; 
            }
            .date { 
              text-align: center; 
              margin-bottom: 8px; 
              font-size: 14px; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 8px; 
              font-size: 13px; 
            }
            th, td { 
              border: 1px solid #000; 
              padding: 4px 6px; 
              text-align: left; 
            }
            th { 
              background-color: #f0f0f0; 
            }
            .nr-col { 
              width: 32px; 
              text-align: center; 
            }
            .lokal-col { 
              width: 220px; 
            }
            .date-col { 
              width: 80px; 
              text-align: center; 
            }
            .person-col { 
              width: 180px; 
            }
            .sign-col { 
              width: 160px; 
            }
            .notes-col { 
              width: 220px; 
            }
          </style>
        </head>
        <body>
          <h1>Raporti i pastrimit të aparateve të kafesë</h1>
          <div class="date">Java: ${mondayStr} - ${sundayStr}</div>
          <div style="height: 8px;"></div>
          <table>
            <thead>
              <tr>
                <th class="nr-col">Nr</th>
                <th class="lokal-col">Lokali</th>
                <th class="date-col">Data e kryerjes</th>
                <th class="person-col">Personi që nënshkroi</th>
                <th class="sign-col">Nënshkrimi</th>
                <th class="notes-col">Shënime ekstra</th>
              </tr>
            </thead>
            <tbody>
              ${locations
                .map((loc, index) => {
                  const sigCell = loc.ownerAcceptance?.ownerSignature
                    ? `<img src="${loc.ownerAcceptance.ownerSignature}" alt="Nënshkrimi" style="max-height: 40px; display: block;" />`
                    : loc.ownerAcceptance?.acceptedTime || "";

                  // Shënime ekstra: only the description / reminders text
                  const notesCombined = loc.reminders || "";

                  return `
                <tr>
                  <td>${index + 1}</td>
                  <td>${loc.name}</td>
                  <td>${loc.ownerAcceptance?.acceptedDate || ""}</td>
                  <td>${loc.ownerAcceptance?.ownerName || ""}</td>
                  <td>${sigCell}</td>
                  <td>${notesCombined}</td>
                </tr>
              `;
                })
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Launch puppeteer in headless mode
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    });

    await browser.close();

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="raport-${mondayStr.replace(/\//g, "-")}-${sundayStr.replace(/\//g, "-")}.pdf"`,
    );
    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer, "binary");
  } catch (error) {
    console.error("Error generating PDF report:", error);
    if (browser) {
      await browser
        .close()
        .catch((err) => console.error("Error closing browser:", err));
    }
    res.status(500).json({ error: "Failed to generate PDF report" });
  }
};
