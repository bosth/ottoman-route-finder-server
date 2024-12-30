const express = require("express");
const app = express();
const pool = require("./db");
const port = 8080;
const cors = require("cors");

app.use(cors());
app.use(express.json());

app.get("/route", async(req, res)=> {
  const { source = 1011, target = 111, modes = 'rail,ferry,tram,metro,ship,road,chaussee,electric tram', year = 1914 } = req.query;
  try {
    const result = await pool.query(`
        SELECT jsonb_build_object('type', 'FeatureCollection', 'features', jsonb_agg(feature)) FROM (
            SELECT jsonb_build_object( 'type', 'Feature', 'id', id, 'geometry', ST_AsGeoJSON(geom)::jsonb, 'properties', jsonb_build_object('source', source, 'target', target, 'mode', mode, 'cost', cost) - 'id' - 'geom' )
        AS feature FROM find_route(${source}, ${target}, '${modes}', ${year}) AS inputs ) AS features;
    `);

    res.status(200).json(result.rows[0].jsonb_build_object);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get("/nodes", async(req, res)=> {
  try {
    const result = await pool.query("SELECT jsonb_build_object('type', 'FeatureCollection', 'features', jsonb_agg(feature)) FROM (SELECT jsonb_build_object( 'type', 'Feature', 'id', id, 'geometry', ST_AsGeoJSON(geom)::jsonb, 'properties', jsonb_build_object('name', name, 'rank', rank) - 'id' - 'geom' ) AS feature FROM nodes AS inputs ) AS features; ");
    res.status(200).json(result.rows[0].jsonb_build_object);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get("/edges", async(req, res)=> {
  try {
    const result = await pool.query("SELECT jsonb_build_object('type', 'FeatureCollection', 'features', jsonb_agg(feature)) FROM (SELECT jsonb_build_object( 'type', 'Feature', 'id', id, 'geometry', ST_AsGeoJSON(geom)::jsonb, 'properties', jsonb_build_object('mode', mode) - 'id' - 'geom' ) AS feature FROM edges_dist AS inputs WHERE mode in ('rail', 'ship', 'ferry', 'tram', 'electric tram', 'metro')) AS features; ");

    res.status(200).json(result.rows[0].jsonb_build_object);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
