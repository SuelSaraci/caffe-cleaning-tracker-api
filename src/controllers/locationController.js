import pool from "../config/database.js";

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
  };
}

export const getAllLocations = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM locations ORDER BY city, name"
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
    const { name, location, city } = req.body;
    if (!name || !location) {
      return res.status(400).json({ error: "name and location are required" });
    }
    const id = `loc-${Date.now()}`;
    await pool.query(
      `INSERT INTO locations (id, name, location, city, cleaned, coffee_delivered, reminders, completed)
       VALUES ($1, $2, $3, $4, false, false, '', false)`,
      [id, name, location, (city ?? "").trim()]
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
    const { name, location, city, cleaned, coffeeDelivered, reminders, completed, ownerAcceptance } = req.body;

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
    const result = await pool.query("DELETE FROM locations WHERE id = $1 RETURNING id", [id]);
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
    const { rawLocations } = await import("../database/seeders/seedData.js");
    const sorted = [...rawLocations].sort((a, b) => {
      const byCity = (a.City || "").localeCompare(b.City || "", "sq");
      return byCity !== 0 ? byCity : (a.Name || "").localeCompare(b.Name || "", "sq");
    });

    await pool.query("DELETE FROM locations");
    for (let i = 0; i < sorted.length; i++) {
      const loc = sorted[i];
      await pool.query(
        `INSERT INTO locations (id, name, location, city, cleaned, coffee_delivered, reminders, completed)
         VALUES ($1, $2, $3, $4, false, false, '', false)`,
        [`loc-${i}`, loc.Name, loc.Location, loc.City ?? ""]
      );
    }

    const result = await pool.query("SELECT * FROM locations ORDER BY city, name");
    res.json(result.rows.map(rowToLocation));
  } catch (error) {
    console.error("Error resetting locations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
