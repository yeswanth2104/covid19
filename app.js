const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;
const dbPath = path.join(__dirname, "covid19India.db");

const installDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }

  installDBAndServer();
};

let snakeToCamel = (each) => {
  return {
    stateId: each.state_id,
    stateName: each.state_name,
    population: each.population,
  };
};

//GET ALL STATES IN STATE TABLE

app.get("/states/", async (request, response) => {
  const getAllStates = `
    select 
        * 
    from 
        state 
    order by 
        state_id;`;

  const states = await db.all(getAllStates);
  const statesList = states.map((each) => snakeToCamel(each));
  response.send(statesList);
});

//GET A STATE_ID API-2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;

  const getAStateId = `
    select
        state_id as stateId,
        state_name as stateName,
        population 
    from 
        state
    where
        state_id=${stateId};  `;

  const state = await db.get(getAStateId);
  response.send(state);
});

//CREATE(POST) A DISTRICT IN DISTRICT TABLE API-3

app.post("/districts/", async (request, response) => {
  const stateDetails = request.body;

  const { districtName, stateId, cases, cured, active, deaths } = stateDetails;

  const addAStateDetails = `
    insert into 
        district (district_name,state_id,cases,cured,active,deaths)
    values
        (
           '${districtName}'
            ${stateId},
            ${cases},
            ${cured},
            ${active},
            ${deaths}
         );`;

  const dbResponse = await db.run(addAStateDetails);
  const districtId = dbResponse.lastID;
  response.send({ districtId: districtId });
});

//GET A DISTRICT BASED ON DISTRICT ID API-4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const getADistrict = `
    select 
        district_name as districtName,
        state_id as stateId,
        cases,
        cured,
        active,
        deaths
    from 
        district 
    where
        district_id=${districtId};        `;

  const district = await db.get(getADistrict);
  response.send(district);
});

//DELETE A DISTRICT API-5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const deleteADistrict = `delete from 
        district 
    where 
        district_id = ${districtId};`;

  await db.run(deleteADistrict);
  response.send("District Removed");
});

//UPDATE(PUT) A DISTRICT DETAILS API-6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const DistrictList = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = DistrictList;

  const updateDistrictDetails = `update
        district
    set
        district_name=${districtName},
        sate_id=${stateId},
        cases=${cases},
        cured=${cured},
        active=${active},
        deaths=${deaths}
    where
        district_id=${districtId};
            `;
  await db.run(updateDistrictDetails);
  response.send("District Details Updated");
});

//GET A TOTAL CASE STATISTICS API-7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const getATotalStats = `select
        sum(cases) as totalCases,
        sum(cured) as totalCured,
        sum(active) as totalActive,
        sum(deaths) as totalDeaths 
    from 
        district 
    where
        state_id=${stateId};        `;

  const totalStats = await db.get(getATotalStats);
  response.send(totalStats);
});

//GET A STATE NAME BASED ON DISTRICT ID API-8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const getAStateName = `select 
        state_name as stateName 
    from 
        state inner join district on state.state_id=district.district.id 
    where
        district_id=${districtId};       `;

  const stateName = await db.get(getAStateName);
  response.send(stateName);
});

module.exports = app;
